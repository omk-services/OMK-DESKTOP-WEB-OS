"""
geordi-carte.py — Inventaire lecture-seule de 03_Resources_Geordi/.

Trois garde-fous durs (le brief les pose comme non negociables) :
  1. Refuse de descendre dans une jonction NTFS (FILE_ATTRIBUTE_REPARSE_POINT). Les
     compte a part, avec leur cible. `os.path.islink()` ne les voit pas.
  2. Plafond 30 000 fichiers parcourus ; au-dela, sortie non-nulle avec resultat
     partiel. Le brief anticipe cette eventualite : "un inventaire partiel annonce
     vaut mieux qu'un poste sature".
  3. Ne lit que le frontmatter (entre les deux `---` en tete) des .md, jamais au-dela
     de FRONTMATTER_LIMIT octets.

Couverture :
  BFS-priorise au niveau 1 : les petits repertoires actifs de la KB sont visites en
  premier (pour donner du grain a cartographier), les gros (deja documentes par
  SECOND_BRAIN_PARA_MAP.md) sont bornes en profondeur. Voir TOP_LEVEL_PRIORITY et
  TOP_LEVEL_DEPTH_LIMIT plus bas.

Sortie : JSON structure. Aucun fichier de Geordi n'est modifie.
Sortie non-nulle sur : racine introuvable, plafond atteint.

Usage :
  python tools/geordi-carte.py [--root <chemin>] [--out <chemin.json>] [--verbose]
                                [--no-skip-noise] [--include <top1,top2>]
"""
from __future__ import annotations
import argparse
import json
import os
import stat
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

# --- Constantes du contrat --------------------------------------------------------
RP = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
MAX_FILES = 30_000
FRONTMATTER_LIMIT = 8192
TOP_N_KEYS = 30

SKIP_DIR_NAMES = frozenset({
    "node_modules", ".git", "dist", "build", "__pycache__", ".cache",
    "coverage", ".next", ".turbo", ".venv", "venv",
})

# BFS-priorise au top-level : on essaie d'abord les petits repertoires actifs de la
# KB (donne une couverture utile) avant de tomber dans les gros.
TOP_LEVEL_PRIORITY = [
    "00_Index",
    "Cerritos_Plane_Settings",
    "Youtube_Take_out",
    "09_Life_OS",
    "_DRAFTS_PPR_LANE",
    "_transcripts_raw",
    "_evals",
    "_TRASH_2026-07-27_phase13_7a_scripts",
    "07_From_Home_Root_2026-08-01",
    "08_Workspaces_Dormants_2026-08-01",
    "graphify-out",
    "02_Templates",
    "03_Memory_Unified",
    "01_Guides",
    "09_From_Home_Root_Batch2_2026-08-01",
    "06_Claude_Code_Bare",
    "05_From_V2_Domains",
    "04_From_V2_Root",
]

# Profondeur max dans les gros repertoires : evite de tomber dans node_modules,
# chunks/, etc. Les autres n'ont pas de limite (le plafond de 30k est global).
TOP_LEVEL_DEPTH_LIMIT = {
    "06_Claude_Code_Bare": 5,
    "graphify-out": 3,
    "01_Guides": 4,
    "04_From_V2_Root": 3,
    "05_From_V2_Domains": 4,
    "08_Workspaces_Dormants_2026-08-01": 4,
}


# --- Detection jonction ----------------------------------------------------------
def is_reparse(entry: os.DirEntry) -> bool:
    try:
        st = entry.stat(follow_symlinks=False)
    except OSError:
        return False
    return bool(st.st_file_attributes & RP)


# --- Lecture frontmatter ---------------------------------------------------------
def parse_frontmatter(path: Path) -> dict[str, Any] | None:
    """Renvoie le dict plat du frontmatter, ou None s'il est absent/illisible.

    Implementation sans PyYAML : Geordi est essentiellement plat (cle=valeur).
    On extrait ligne a ligne entre les deux `---`. Suffisant pour compter les
    cles et leur taux de remplissage.
    """
    try:
        with path.open("rb") as f:
            head = f.read(FRONTMATTER_LIMIT)
    except OSError:
        return None
    if not head.startswith(b"---"):
        return None
    body = head.split(b"\n", 1)[1] if b"\n" in head else b""
    sep = b"\n---"
    end = body.find(sep)
    if end < 0:
        return None
    fm_bytes = body[:end]
    fm: dict[str, Any] = {}
    for raw in fm_bytes.splitlines():
        line = raw.strip()
        if not line or line.startswith(b"#"):
            continue
        if b":" not in line:
            continue
        k, _, v = raw.partition(b":")
        key = k.strip().decode("utf-8", "replace").lower()
        val = v.strip().decode("utf-8", "replace")
        if len(val) >= 2 and val[0] == val[-1] and val[0] in ('"', "'"):
            val = val[1:-1]
        fm[key] = val
    return fm if fm else {}


def description_nonempty(fm: dict[str, Any]) -> bool:
    v = fm.get("description")
    return isinstance(v, str) and len(v.strip()) > 0


# --- Inventaire ------------------------------------------------------------------
class Inventory:
    """Compteurs partages entre tous les appels de walk."""
    def __init__(self, root: Path) -> None:
        self.root = root
        self.files_total = 0
        self.bytes_total = 0
        self.quota_hit = False
        self.quota_marker_path: str | None = None
        self.ext_counter: Counter[str] = Counter()
        self.fm_total = 0
        self.fm_description_present = 0
        self.fm_keys: Counter[str] = Counter()
        self.fm_key_population: Counter[str] = Counter()
        self.top_level: dict[str, dict[str, Any]] = {}
        self.second_level: dict[str, Counter[str] | dict[str, Any]] = defaultdict(
            lambda: {"files": 0, "bytes": 0, "md_files": 0,
                     "md_with_frontmatter": 0, "md_with_description": 0,
                     "ext": Counter(), "fm_keys": Counter()}
        )
        self.junctions: list[dict[str, Any]] = []
        self.skipped_dirs: list[str] = []

    def consume_file(self, entry: os.DirEntry, st: os.stat_result) -> None:
        path = Path(entry.path)
        size = st.st_size
        ext = path.suffix.lower() or "(none)"
        self.files_total += 1
        self.bytes_total += size
        self.ext_counter[ext] += 1
        rel = path.relative_to(self.root)
        parts = rel.parts
        top = parts[0] if parts else "_root"
        t = self.top_level.setdefault(top, {
            "files": 0, "bytes": 0, "md_files": 0,
            "md_with_frontmatter": 0, "md_with_description": 0, "ext": Counter(),
        })
        t["files"] += 1
        t["bytes"] += size
        t["ext"][ext] += 1
        if ext == ".md":
            t["md_files"] += 1
        if len(parts) >= 2:
            key2 = f"{parts[0]}/{parts[1]}"
            s = self.second_level[key2]
            s["files"] += 1  # type: ignore[index]
            s["bytes"] += size  # type: ignore[index]
            s["ext"][ext] += 1  # type: ignore[index]
        if ext != ".md":
            return
        fm = parse_frontmatter(path)
        if fm is not None:
            self.fm_total += 1
            t["md_with_frontmatter"] += 1
            if len(parts) >= 2:
                self.second_level[f"{parts[0]}/{parts[1]}"]["md_with_frontmatter"] += 1  # type: ignore[index]
            if description_nonempty(fm):
                self.fm_description_present += 1
                t["md_with_description"] += 1
                if len(parts) >= 2:
                    self.second_level[f"{parts[0]}/{parts[1]}"]["md_with_description"] += 1  # type: ignore[index]
            for k in fm.keys():
                self.fm_keys[k] += 1
                self.fm_key_population[k] += 1
                if len(parts) >= 2:
                    self.second_level[f"{parts[0]}/{parts[1]}"]["fm_keys"][k] += 1  # type: ignore[index]

    def hit_quota(self, where: Path) -> None:
        self.quota_hit = True
        self.quota_marker_path = str(where.relative_to(self.root))

    def to_json(self) -> dict[str, Any]:
        top_out: dict[str, Any] = {}
        for k, v in self.top_level.items():
            top_out[k] = {
                "files": v["files"],
                "bytes": v["bytes"],
                "md_files": v["md_files"],
                "md_with_frontmatter": v["md_with_frontmatter"],
                "md_with_description": v["md_with_description"],
                "ext_top10": v["ext"].most_common(10),
            }
        second_out: dict[str, Any] = {}
        for k, v in self.second_level.items():
            second_out[k] = {
                "files": v["files"],
                "bytes": v["bytes"],
                "md_files": v["md_files"],
                "md_with_frontmatter": v["md_with_frontmatter"],
                "md_with_description": v["md_with_description"],
                "ext_top10": dict(v["ext"].most_common(10)),
                "fm_keys_top10": dict(v["fm_keys"].most_common(10)),
            }
        top_by_bytes = sorted(
            ((k, v["bytes"]) for k, v in self.top_level.items()),
            key=lambda x: x[1], reverse=True,
        )
        return {
            "schema_version": 1,
            "root": str(self.root),
            "guard": {
                "max_files": MAX_FILES,
                "files_walked": self.files_total,
                "quota_hit": self.quota_hit,
                "quota_marker_path": self.quota_marker_path,
                "skipped_dirs": self.skipped_dirs,
            },
            "totals": {
                "files": self.files_total,
                "bytes": self.bytes_total,
                "ext_top20": self.ext_counter.most_common(20),
                "md_files_with_frontmatter": self.fm_total,
                "md_files_with_description_nonempty": self.fm_description_present,
                "junctions_detected_not_followed": len(self.junctions),
                "fm_keys_top30": self.fm_keys.most_common(TOP_N_KEYS),
            },
            "top_level": top_out,
            "top_level_by_bytes_desc": top_by_bytes,
            "second_level": second_out,
            "junctions": self.junctions,
        }


def walk_subtree(
    inv: Inventory,
    entry: os.DirEntry,
    depth: int,
    depth_limit: int,
    include_substring: str | None,
    skip_noise: bool,
    verbose: bool,
) -> None:
    """DFS iteratif dans le sous-arbre de `entry`, en respectant les garde-fous."""
    stack: list[tuple[os.DirEntry, int]] = [(entry, depth)]
    while stack:
        if inv.files_total >= MAX_FILES:
            inv.hit_quota(Path(stack[-1][0].path))
            return
        current, d = stack.pop()
        top_name = Path(current.path).relative_to(inv.root).parts[0]
        if include_substring is not None and include_substring not in top_name:
            return  # sous-dossier hors-liste, on saute tout
        try:
            entries = list(os.scandir(current.path))
        except OSError as e:
            sys.stderr.write(f"[WARN] scandir illisible : {current.path} ({e})\n")
            continue

        for child in entries:
            # Garde-fou jonction
            if child.is_dir(follow_symlinks=False):
                if is_reparse(child):
                    try:
                        target = os.readlink(child.path)
                    except OSError:
                        target = "<lecture cible impossible>"
                    inv.junctions.append({
                        "path": str(Path(child.path).relative_to(inv.root)),
                        "target": target,
                        "depth_from_root": d + 1,
                    })
                    if verbose:
                        sys.stderr.write(f"[JCT ] {child.path} -> {target}\n")
                    continue
                if skip_noise and child.name in SKIP_DIR_NAMES:
                    inv.skipped_dirs.append(str(Path(child.path).relative_to(inv.root)))
                    if verbose:
                        sys.stderr.write(f"[SKIP] {child.path}\n")
                    continue
                if d >= depth_limit:
                    if verbose:
                        sys.stderr.write(f"[DEEP] {child.path} (depth={d+1}, limit={depth_limit})\n")
                    continue
                stack.append((child, d + 1))
                continue
            # Fichier
            try:
                st = child.stat(follow_symlinks=False)
            except OSError:
                continue
            if inv.files_total >= MAX_FILES:
                inv.hit_quota(Path(child.path))
                return
            inv.consume_file(child, st)


def main(argv: list[str] | None = None) -> int:
    file_here = Path(__file__).resolve()
    candidates = [file_here.parents[i] for i in range(6, 11)]
    default_root = next((c for c in candidates if (c / "00_Index").is_dir()), file_here.parents[6])

    p = argparse.ArgumentParser(description="Inventaire lecture-seule de 03_Resources_Geordi/")
    p.add_argument("--root", default=os.environ.get("GEORDI_ROOT", str(default_root)),
                   help="Racine Geordi (defaut: ../../03_Resources_Geordi)")
    p.add_argument("--out", default=None, help="Chemin JSON de sortie (defaut: stdout)")
    p.add_argument("--verbose", action="store_true", help="Log jonctions + dossiers skipes/profonds")
    p.add_argument("--no-skip-noise", dest="skip_noise", action="store_false", default=True,
                   help="Inclure node_modules, .git, caches (defaut: exclus)")
    p.add_argument("--include", default=None,
                   help="Restreindre aux sous-dossiers de 1er niveau contenant cette sous-chaine (ex: '00_Index,02_Templates')")
    args = p.parse_args(argv)

    root = Path(args.root)
    if not root.exists():
        sys.stderr.write(f"[FATAL] Racine introuvable : {root}\n")
        return 2
    if not root.is_dir():
        sys.stderr.write(f"[FATAL] Racine pas un repertoire : {root}\n")
        return 2

    inv = Inventory(root)

    include_substring = args.include
    if include_substring:
        include_substring = include_substring.strip()

    try:
        top_entries = sorted(os.scandir(root), key=lambda e: e.name)
    except OSError as e:
        sys.stderr.write(f"[FATAL] scandir racine : {e}\n")
        return 2
    by_name = {e.name: e for e in top_entries}
    ordered: list[os.DirEntry] = []
    for prio in TOP_LEVEL_PRIORITY:
        if prio in by_name:
            ordered.append(by_name.pop(prio))
    ordered.extend(sorted(by_name.values(), key=lambda e: e.name))

    for top in ordered:
        if inv.files_total >= MAX_FILES:
            inv.hit_quota(Path(top.path))
            break
        if include_substring is not None and include_substring not in top.name:
            continue
        try:
            is_dir = top.is_dir(follow_symlinks=False)
        except OSError:
            continue
        if not is_dir:
            # fichier racine : on l'engloutit directement
            try:
                st = top.stat(follow_symlinks=False)
            except OSError:
                continue
            inv.consume_file(top, st)
            continue
        if is_reparse(top):
            try:
                target = os.readlink(top.path)
            except OSError:
                target = "<lecture cible impossible>"
            inv.junctions.append({
                "path": str(Path(top.path).relative_to(root)),
                "target": target,
                "depth_from_root": 1,
            })
            if args.verbose:
                sys.stderr.write(f"[JCT ] {top.path} -> {target}\n")
            continue
        depth_limit = TOP_LEVEL_DEPTH_LIMIT.get(top.name, 99)
        walk_subtree(inv, top, 1, depth_limit, include_substring, args.skip_noise, args.verbose)

    payload = json.dumps(inv.to_json(), ensure_ascii=False, indent=2, default=str)
    if args.out:
        Path(args.out).write_text(payload, encoding="utf-8")
        sys.stderr.write(f"[OK ] ecrit : {args.out} ({len(payload)} octets)\n")
    else:
        print(payload)
    return 3 if inv.quota_hit else 0


if __name__ == "__main__":
    sys.exit(main())

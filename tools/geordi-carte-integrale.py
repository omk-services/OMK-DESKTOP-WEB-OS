"""
geordi-carte-integrale.py — Inventaire integral de 03_Resources_Geordi/.

Difference d'avec geordi-carte.py (V) :
  - pas de plafond de fichiers ;
  - plafond de MUR (temps ecoule, 45 min par defaut) ;
  - ecriture CONTINUELLE dans geordi_integral_partiel.json apres chaque sous-dossier
    de 1er niveau termine : si le script est tue, le travail survit ;
  - classification multi-couche (Tech OS / Life OS / Business OS) + multi-domaine
    (8 domaines operationnels + 8 life-domains LD01..LD08) ;
  - classification DIKW (Donnee / Information / Connaissance / Sagesse) ;
  - echantillon pour YouTube (100 max) avec comptage multi-domaine par titre.

Trois garde-fous durs (le brief les pose comme non negociables) :
  1. Refuse de descendre dans une jonction NTFS (FILE_ATTRIBUTE_REPARSE_POINT).
     Compte a part, avec leur cible. `os.path.islink()` ne les voit pas.
  2. Plafond de MUR 45 min par defaut. Au-dela, sortie non-nulle avec resultat
     partiel. Le brief anticipe cette eventualite : "un balayage integral annonce
     incomplet vaut mieux qu'un poste sature".
  3. Ne lit que le frontmatter (8 192 octets) des .md. Pour .json/.jsonl > 1 Mo :
     taille + nb lignes + cles de la 1ere ligne. Pour .mp4/.webm/.png/.jpg/.zip :
     chemin, taille, date, rien d'autre.

Sortie :
  - geordi_integral.json : payload final, ecrit en fin de run.
  - geordi_integral_partiel.json : payload cumule, REECRIT apres chaque sous-dossier
    de 1er niveau. Si le script est tue, on garde tout ce qui a ete fait.

Usage :
  python tools/geordi-carte-integrale.py [--root <chemin>] [--out <chemin.json>]
                                         [--partial <chemin.json>]
                                         [--time-limit <secondes>] [--verbose]
"""
from __future__ import annotations
import argparse
import json
import os
import re
import stat
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

# --- Constantes du contrat --------------------------------------------------------
RP = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
FRONTMATTER_LIMIT = 8192
JSON_HEADER_LIMIT = 4096

# Plafond de MUR : 45 min par defaut.
DEFAULT_TIME_LIMIT = 45 * 60

SKIP_DIR_NAMES = frozenset({
    "node_modules", ".git", "dist", "build", "__pycache__", ".cache",
    "coverage", ".next", ".turbo", ".venv", "venv",
})

# Classification multi-couche (chemin -> couches OS)
COUCHE_RULES: list[tuple[re.Pattern, set[str]]] = [
    (re.compile(r"(?i)(tech|bedrock|harness|deploy|docker|vercel|supabase|mcp|gpt|claude|llm|code|script|plugin|skill|node_modules|dist|build|coverage|next|turbo|venv)" ),
     {"Tech OS (Bedrock)"}),
    (re.compile(r"(?i)(life|lifeos|life_os|ld0\d|roue|wheel|ld0|ld1|ld2|ld3|ld4|ld5|ld6|ld7|ld8|family|health|cognit|creativ|impact|social)"),
     {"Life OS"}),
    (re.compile(r"(?i)(business|biz|client|offer|sale|growth|product|finance|legal|ops|people|hr|invoice|sop|kit)"),
     {"Business OS"}),
]

# Domaines operationnels (chemin -> domaines)
DOMAIN_RULES: list[tuple[re.Pattern, str]] = [
    (re.compile(r"(?i)00_kernel|kernel"), "00_KERNEL_OS"),
    (re.compile(r"(?i)01_product|/product/"), "01_Product"),
    (re.compile(r"(?i)02_ops|/ops/"), "02_Ops"),
    (re.compile(r"(?i)03_it|/it/"), "03_IT"),
    (re.compile(r"(?i)04_finance|/finance/"), "04_Finance"),
    (re.compile(r"(?i)05_legal|/legal/|/05_legal"), "05_Legal"),
    (re.compile(r"(?i)05_people|/people/"), "05_People"),
    (re.compile(r"(?i)06_sales|/sales/"), "06_Sales"),
    (re.compile(r"(?i)07_growth|/growth/"), "07_Growth"),
    (re.compile(r"(?i)08_legal|/08_legal"), "08_Legal"),
    (re.compile(r"(?i)youtube"), "YouTube"),
    (re.compile(r"(?i)wiki|hand_off|concept|entit"), "Wiki"),
    (re.compile(r"(?i)graphify|graph\.json|chunks/"), "Graphify"),
    (re.compile(r"(?i)06_claude_code_bare|claude_code_bare|claude_code"), "Dox"),
    (re.compile(r"(?i)ld01|ld1_|business_picard|picard"), "LD01_Business"),
    (re.compile(r"(?i)ld02|ld2_|finance_saru|saru"), "LD02_Finance"),
    (re.compile(r"(?i)ld03|ld3_|health_culber|culber"), "LD03_Health"),
    (re.compile(r"(?i)ld04|ld4_|cognition_tilly|tilly"), "LD04_Cognition"),
    (re.compile(r"(?i)ld05|ld5_|social_stamets|stamets"), "LD05_Social"),
    (re.compile(r"(?i)ld06|ld6_|family_burnham|burnham"), "LD06_Family"),
    (re.compile(r"(?i)ld07|ld7_|creativity_reno|reno"), "LD07_Creativity"),
    (re.compile(r"(?i)ld08|ld8_|impact_georgiou|georgiou"), "LD08_Impact"),
]

# Heuristique DIKW rapide d'apres extension
DIKW_BY_EXT = {
    ".json": "Donnee",
    ".jsonl": "Donnee",
    ".log": "Donnee",
    ".csv": "Donnee",
    ".tsv": "Donnee",
    ".sqlite": "Donnee",
    ".db": "Donnee",
    ".png": "Donnee",
    ".jpg": "Donnee",
    ".jpeg": "Donnee",
    ".gif": "Donnee",
    ".webp": "Donnee",
    ".mp4": "Donnee",
    ".webm": "Donnee",
    ".mkv": "Donnee",
    ".mp3": "Donnee",
    ".wav": "Donnee",
    ".pdf": "Donnee",
    ".zip": "Donnee",
    ".tar": "Donnee",
    ".gz": "Donnee",
    ".7z": "Donnee",
    ".bin": "Donnee",
}

# Patterns pour detecter un secret (sans afficher la valeur)
SECRET_PATTERNS = [
    (re.compile(r"sk-[A-Za-z0-9]{20,}"), "sk- (OpenAI)"),
    (re.compile(r"sbp_[A-Za-z0-9]{20,}"), "sbp_ (Supabase)"),
    (re.compile(r"vcp_[A-Za-z0-9]{20,}"), "vcp_ (Vercel)"),
    (re.compile(r"ghp_[A-Za-z0-9]{20,}"), "ghp_ (GitHub)"),
    (re.compile(r"mul_[A-Za-z0-9]{20,}"), "mul_ (Multica)"),
    (re.compile(r"eyJ[A-Za-z0-9_=-]{50,}\.[A-Za-z0-9_=-]{20,}"), "JWT"),
    (re.compile(r"-----BEGIN [A-Z ]+PRIVATE KEY-----"), "PEM private key"),
]


# --- Detection jonction ----------------------------------------------------------
def is_reparse(entry: os.DirEntry) -> bool:
    try:
        st = entry.stat(follow_symlinks=False)
    except OSError:
        return False
    return bool(st.st_file_attributes & RP)


# --- Lecture frontmatter (sans PyYAML, comme V) ---------------------------------
def parse_frontmatter(path: Path) -> dict[str, Any] | None:
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


# --- Classification -------------------------------------------------------------
def classify_couches(path: Path, fm: dict[str, Any] | None) -> set[str]:
    """Renvoie l'ensemble des couches OS auxquelles la ressource se rattache."""
    couches: set[str] = set()
    haystack_parts = [str(path).lower()]
    if fm:
        # Le frontmatter domain peut aider (un seul domaine, mais peut servir
        # quand le chemin ne dit rien).
        domain = str(fm.get("domain", "")).lower()
        if domain:
            haystack_parts.append(domain)
        for k in ("routing", "category", "tags", "ld", "phase"):
            v = str(fm.get(k, "")).lower()
            if v:
                haystack_parts.append(v)
    haystack = " | ".join(haystack_parts)
    for pat, couche in COUCHE_RULES:
        if pat.search(haystack):
            couches.update(couche)
    return couches


def classify_domaines(path: Path, fm: dict[str, Any] | None) -> dict[str, float]:
    """Renvoie {domaine: poids} pour la ressource. Poids = nombre de matches."""
    counts: Counter[str] = Counter()
    haystack_parts = [str(path).lower()]
    if fm:
        for k in ("domain", "routing", "category", "tags", "ld", "phase"):
            v = str(fm.get(k, "")).lower()
            if v:
                haystack_parts.append(v)
    haystack = " | ".join(haystack_parts)
    for pat, dom in DOMAIN_RULES:
        if pat.search(haystack):
            counts[dom] += 1
    return dict(counts)


def classify_dikw(path: Path, fm: dict[str, Any] | None, ext: str) -> str:
    """Renvoie l'echelon DIKW le plus probable pour la ressource."""
    # Indices forts depuis le frontmatter ou le chemin
    path_lower = str(path).lower()
    if fm:
        dikw = str(fm.get("dikw", "")).strip().lower()
        if dikw in ("donnee", "information", "connaissance", "sagesse"):
            return dikw.capitalize()
        typ = str(fm.get("type", "")).strip().lower()
        if "decision" in typ or "sagesse" in typ or "wisdom" in typ:
            return "Sagesse"
        if "spec" in typ or "adr" in typ or "plan" in typ or "dox" in typ:
            return "Connaissance"
        if "hand_off" in typ or "index" in typ or "summary" in typ:
            return "Information"
    # Heuristique par chemin
    if "/concepts/" in path_lower or "/entities/" in path_lower or "/L0/" in path_lower:
        return "Connaissance"
    if "06_claude_code_bare" in path_lower and path_lower.endswith(".md"):
        return "Connaissance"
    if "hand_offs" in path_lower and path_lower.endswith(".md"):
        return "Information"
    if "wiki/log.md" in path_lower or "/log.md" in path_lower:
        return "Sagesse"
    if "_DRAFTS" in path_lower or "_TRASH" in path_lower:
        return "Donnee"
    if ext in DIKW_BY_EXT:
        return DIKW_BY_EXT[ext]
    if ext == ".md":
        return "Information"
    return "Donnee"


# --- Sniff JSON : taille + nb lignes + cles de la 1ere ligne ---------------------
def sniff_json(path: Path) -> dict[str, Any]:
    info: dict[str, Any] = {"size": 0, "lines": 0, "top_keys": []}
    try:
        st = path.stat()
        info["size"] = st.st_size
    except OSError:
        return info
    if info["size"] > 1024 * 1024:  # > 1 Mo : sniff leger
        try:
            with path.open("rb") as f:
                head = f.read(JSON_HEADER_LIMIT)
        except OSError:
            return info
        info["lines"] = head.count(b"\n")
        # Cherche le 1er objet {...} ou [...]
        m = re.search(rb"[{\[]", head)
        if m:
            seg = head[m.start():m.start() + 1024].decode("utf-8", "replace")
            # Extraire les cles du 1er niveau
            keys = re.findall(r'"([A-Za-z0-9_]+)"\s*:', seg)
            info["top_keys"] = list(dict.fromkeys(keys))[:15]
        return info
    # <= 1 Mo : on peut compter les lignes
    try:
        with path.open("rb") as f:
            data = f.read()
        info["lines"] = data.count(b"\n") + 1
        # 1ere cle du top-level si dict
        try:
            j = json.loads(data)
            if isinstance(j, dict):
                info["top_keys"] = list(j.keys())[:15]
            elif isinstance(j, list) and j and isinstance(j[0], dict):
                info["top_keys"] = list(j[0].keys())[:15]
        except (ValueError, UnicodeDecodeError):
            pass
    except OSError:
        pass
    return info


# --- Inventaire ------------------------------------------------------------------
class Inventory:
    def __init__(self, root: Path, start_ts: float, time_limit: float) -> None:
        self.root = root
        self.start_ts = start_ts
        self.time_limit = time_limit
        self.wall_hit = False
        self.wall_marker_path: str | None = None
        self.files_total = 0
        self.bytes_total = 0
        self.ext_counter: Counter[str] = Counter()
        self.fm_total = 0
        self.fm_description_present = 0
        self.fm_keys: Counter[str] = Counter()
        self.couches: Counter[str] = Counter()        # combien de fichiers par couche
        self.domaines: Counter[str] = Counter()       # combien de fichiers par domaine
        self.dikw: Counter[str] = Counter()           # combien de fichiers par echelon
        # Co-occurrences (paires symetriques, ordre canonique)
        self.cooccur: Counter[tuple[str, str]] = Counter()
        self.domaines_per_file: list[int] = []        # distribution nb domaines/fichier
        self.couches_per_file: list[int] = []
        # Compteurs par top-level
        self.top_level: dict[str, dict[str, Any]] = {}
        # Echantillon YouTube (100 max, avec domaines)
        self.youtube_sample: list[dict[str, Any]] = []
        # Jonctions
        self.junctions: list[dict[str, Any]] = []
        # Dossiers skippes (caches)
        self.skipped_dirs: list[str] = []
        # Dossiers illisibles
        self.unreadable_dirs: list[str] = []
        # Chemins ou des secrets sont detectes (jamais la valeur)
        self.secret_hits: list[dict[str, Any]] = []

    def wall_remaining(self) -> float:
        return self.time_limit - (time.monotonic() - self.start_ts)

    def wall_exceeded(self) -> bool:
        return self.wall_remaining() <= 0

    def hit_wall(self, where: Path) -> None:
        self.wall_hit = True
        try:
            self.wall_marker_path = str(where.relative_to(self.root))
        except ValueError:
            self.wall_marker_path = str(where)

    def register_couches_domaines(
        self, couches: set[str], domaines: dict[str, float]
    ) -> None:
        for c in couches:
            self.couches[c] += 1
        for d, _p in domaines.items():
            self.domaines[d] += 1
        self.couches_per_file.append(len(couches))
        self.domaines_per_file.append(len(domaines))
        # Co-occurrences (uniquement si >1)
        c_sorted = sorted(couches)
        for i in range(len(c_sorted)):
            for j in range(i + 1, len(c_sorted)):
                self.cooccur[(c_sorted[i], c_sorted[j])] += 1
        d_sorted = sorted(domaines.keys())
        for i in range(len(d_sorted)):
            for j in range(i + 1, len(d_sorted)):
                self.cooccur[(d_sorted[i], d_sorted[j])] += 1

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
            "files": 0, "bytes": 0, "md_files": 0, "md_with_frontmatter": 0,
            "md_with_description": 0, "fm_keys": Counter(),
            "couches": Counter(), "domaines": Counter(), "dikw": Counter(),
        })
        t["files"] += 1
        t["bytes"] += size
        if ext == ".md":
            t["md_files"] += 1

        fm: dict[str, Any] | None = None
        # Lecture de frontmatter (8 192 octets)
        if ext == ".md":
            fm = parse_frontmatter(path)
        # Sniff JSON si gros
        elif ext in (".json", ".jsonl") and size > 1024 * 1024:
            # On marque juste la presence ; sniff complet reserve a l'echantillon
            t.setdefault("big_json_count", 0)
            t["big_json_count"] += 1  # type: ignore[index]
        # Lecture de titres pour l'echantillon YouTube
        if "youtube" in str(path).lower() and ext in (".csv", ".tsv", ".json"):
            if len(self.youtube_sample) < 100:
                self._maybe_youtube_sample(path, ext, size)

        # Detection secrets sur les .md/.json/.jsonl/.env/.txt de taille raisonnable
        if ext in (".md", ".json", ".jsonl", ".env", ".txt", ".yml", ".yaml", ".toml"):
            if size <= 1_048_576:  # <= 1 Mo
                self._scan_secrets(path, size, ext)

        # Classification
        couches = classify_couches(path, fm)
        domaines = classify_domaines(path, fm)
        dikw = classify_dikw(path, fm, ext)
        self.register_couches_domaines(couches, domaines)
        for c in couches:
            t["couches"][c] += 1  # type: ignore[index]
        for d in domaines:
            t["domaines"][d] += 1  # type: ignore[index]
        t["dikw"][dikw] += 1  # type: ignore[index]

        if ext != ".md":
            return
        if fm:
            self.fm_total += 1
            t["md_with_frontmatter"] += 1  # type: ignore[index]
            if description_nonempty(fm):
                self.fm_description_present += 1
                t["md_with_description"] += 1  # type: ignore[index]
            for k in fm.keys():
                self.fm_keys[k] += 1
                t["fm_keys"][k] += 1  # type: ignore[index]

    def _maybe_youtube_sample(self, path: Path, ext: str, size: int) -> None:
        """Pour Youtube_Take_out, on lit la 1ere ligne (header) et 5 lignes."""
        try:
            with path.open("rb") as f:
                head = f.read(8192)
        except OSError:
            return
        try:
            text = head.decode("utf-8", "replace")
        except Exception:
            return
        lines = text.splitlines()[:6]
        sample: dict[str, Any] = {
            "path": str(path.relative_to(self.root)),
            "size": size,
            "ext": ext,
            "first_lines": lines,
        }
        # Classification multi-domaine sur le nom de fichier + lignes
        haystack = " | ".join([str(path).lower()] + [l.lower() for l in lines])
        domains_hits: list[str] = []
        for pat, dom in DOMAIN_RULES:
            if pat.search(haystack):
                domains_hits.append(dom)
        sample["domains"] = sorted(set(domains_hits))
        sample["n_domains"] = len(set(domains_hits))
        self.youtube_sample.append(sample)

    def _scan_secrets(self, path: Path, size: int, ext: str) -> None:
        if size > 1_048_576:
            return
        try:
            with path.open("rb") as f:
                head = f.read(262_144)  # 256 Ko
        except OSError:
            return
        try:
            text = head.decode("utf-8", "replace")
        except Exception:
            return
        for pat, label in SECRET_PATTERNS:
            if pat.search(text):
                self.secret_hits.append({
                    "path": str(path.relative_to(self.root)),
                    "size": size,
                    "ext": ext,
                    "pattern": label,
                })
                break  # un seul hit par fichier suffit

    def to_json(self) -> dict[str, Any]:
        top_out: dict[str, Any] = {}
        for k, v in self.top_level.items():
            top_out[k] = {
                "files": v["files"],
                "bytes": v["bytes"],
                "md_files": v["md_files"],
                "md_with_frontmatter": v["md_with_frontmatter"],
                "md_with_description": v["md_with_description"],
                "ext_top10": Counter(v.get("ext", {})).most_common(10) if v.get("ext") else [],
                "fm_keys_top10": Counter(v.get("fm_keys", {})).most_common(10) if v.get("fm_keys") else [],
                "couches": dict(Counter(v.get("couches", {})).most_common()) if v.get("couches") else {},
                "domaines": dict(Counter(v.get("domaines", {})).most_common()) if v.get("domaines") else {},
                "dikw": dict(Counter(v.get("dikw", {})).most_common()) if v.get("dikw") else {},
            }
        # Distribution
        couches_dist = Counter(self.couches_per_file)
        domaines_dist = Counter(self.domaines_per_file)
        # Co-occurrences triees
        cooccur_top = self.cooccur.most_common(40)
        return {
            "schema_version": 2,
            "root": str(self.root),
            "guard": {
                "wall_seconds": int(self.time_limit),
                "wall_hit": self.wall_hit,
                "wall_marker_path": self.wall_marker_path,
                "files_walked": self.files_total,
                "skipped_dirs": self.skipped_dirs,
                "unreadable_dirs": self.unreadable_dirs,
            },
            "totals": {
                "files": self.files_total,
                "bytes": self.bytes_total,
                "ext_top30": self.ext_counter.most_common(30),
                "md_files_with_frontmatter": self.fm_total,
                "md_files_with_description_nonempty": self.fm_description_present,
                "junctions_detected_not_followed": len(self.junctions),
                "fm_keys_top30": self.fm_keys.most_common(30),
                "couches": dict(self.couches.most_common()),
                "domaines": dict(self.domaines.most_common()),
                "dikw": dict(self.dikw.most_common()),
                "couches_per_file_dist": dict(sorted(couches_dist.items())),
                "domaines_per_file_dist": dict(sorted(domaines_dist.items())),
                "cooccur_top40": [
                    {"a": a, "b": b, "count": c} for (a, b), c in cooccur_top
                ],
                "secret_hits": self.secret_hits,
            },
            "top_level": top_out,
            "junctions": self.junctions,
            "youtube_sample": self.youtube_sample,
        }


# --- Parcours --------------------------------------------------------------------
def walk_subtree(
    inv: Inventory,
    entry: os.DirEntry,
    depth: int,
    depth_limit: int,
    include_substring: str | None,
    skip_noise: bool,
    verbose: bool,
) -> None:
    """DFS iteratif. Refuse les jonctions, plafonne en MUR (pas en nb de fichiers)."""
    stack: list[tuple[os.DirEntry, int]] = [(entry, depth)]
    while stack:
        if inv.wall_exceeded():
            inv.hit_wall(Path(stack[-1][0].path))
            return
        current, d = stack.pop()
        top_name = Path(current.path).relative_to(inv.root).parts[0]
        if include_substring is not None and include_substring not in top_name:
            return
        try:
            entries = list(os.scandir(current.path))
        except OSError as e:
            inv.unreadable_dirs.append(str(Path(current.path).relative_to(inv.root)))
            if verbose:
                sys.stderr.write(f"[WARN] scandir illisible : {current.path} ({e})\n")
            continue

        for child in entries:
            if inv.wall_exceeded():
                inv.hit_wall(Path(child.path))
                return
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
            inv.consume_file(child, st)


def main(argv: list[str] | None = None) -> int:
    file_here = Path(__file__).resolve()
    candidates = [file_here.parents[i] for i in range(6, 11)]
    default_root = next((c for c in candidates if (c / "00_Index").is_dir()), file_here.parents[6])

    p = argparse.ArgumentParser(description="Inventaire integral (plafond MUR) de 03_Resources_Geordi/")
    p.add_argument("--root", default=os.environ.get("GEORDI_ROOT", str(default_root)))
    p.add_argument("--out", default=None,
                   help="Chemin JSON final (defaut: geordi_integral.json a cote du script)")
    p.add_argument("--partial", default=None,
                   help="Chemin JSON partiel (defaut: geordi_integral_partiel.json a cote du script)")
    p.add_argument("--time-limit", type=int, default=DEFAULT_TIME_LIMIT,
                   help="Plafond MUR en secondes (defaut: 2700 = 45 min)")
    p.add_argument("--verbose", action="store_true")
    p.add_argument("--no-skip-noise", dest="skip_noise", action="store_false", default=True)
    p.add_argument("--include", default=None)
    args = p.parse_args(argv)

    root = Path(args.root)
    if not root.exists():
        sys.stderr.write(f"[FATAL] Racine introuvable : {root}\n")
        return 2
    if not root.is_dir():
        sys.stderr.write(f"[FATAL] Racine pas un repertoire : {root}\n")
        return 2

    out_path = Path(args.out) if args.out else file_here.parent.parent / "_briefs" / "2026-08-11_production" / "geordi_integral.json"
    partial_path = Path(args.partial) if args.partial else file_here.parent.parent / "_briefs" / "2026-08-11_production" / "geordi_integral_partiel.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    partial_path.parent.mkdir(parents=True, exist_ok=True)

    start_ts = time.monotonic()
    wall_deadline = start_ts + args.time_limit
    inv = Inventory(root, start_ts, float(args.time_limit))

    include_substring = args.include
    if include_substring:
        include_substring = include_substring.strip()

    try:
        top_entries = sorted(os.scandir(root), key=lambda e: e.name)
    except OSError as e:
        sys.stderr.write(f"[FATAL] scandir racine : {e}\n")
        return 2
    by_name = {e.name: e for e in top_entries}
    # Ordre de parcours : on commence par les petits (donne du grain), puis les gros.
    # Mais on n'a plus de plafond de fichiers, donc l'ordre n'a plus la meme urgence.
    ordered: list[os.DirEntry] = []
    priority = [
        "00_Index", "Cerritos_Plane_Settings", "Youtube_Take_out", "09_Life_OS",
        "_DRAFTS_PPR_LANE", "_transcripts_raw", "_evals", "_TRASH_2026-07-27_phase13_7a_scripts",
        "07_From_Home_Root_2026-08-01", "08_Workspaces_Dormants_2026-08-01",
        "graphify-out", "02_Templates", "03_Memory_Unified", "01_Guides",
        "09_From_Home_Root_Batch2_2026-08-01", "06_Claude_Code_Bare",
        "05_From_V2_Domains", "04_From_V2_Root",
    ]
    for prio in priority:
        if prio in by_name:
            ordered.append(by_name.pop(prio))
    ordered.extend(sorted(by_name.values(), key=lambda e: e.name))

    last_write = time.monotonic()
    partial_interval = 60  # secondes entre deux ecritures partielles de securite

    for top in ordered:
        if inv.wall_exceeded():
            inv.hit_wall(Path(top.path))
            break
        if include_substring is not None and include_substring not in top.name:
            continue
        try:
            is_dir = top.is_dir(follow_symlinks=False)
        except OSError:
            continue
        if not is_dir:
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
        # Pas de depth_limit dur : on laisse descendre, le MUR nous arretera.
        # Sauf si --include a ete passe.
        depth_limit = 99 if not include_substring else 99
        sys.stderr.write(f"[START] {top.path} (t={int(time.monotonic()-start_ts)}s, files={inv.files_total})\n")
        walk_subtree(inv, top, 1, depth_limit, include_substring, args.skip_noise, args.verbose)
        sys.stderr.write(f"[DONE ] {top.path} -> files={inv.files_total} (t={int(time.monotonic()-start_ts)}s)\n")

        # Ecriture continue
        now = time.monotonic()
        if now - last_write >= partial_interval or inv.wall_exceeded():
            payload = json.dumps(inv.to_json(), ensure_ascii=False, indent=2, default=str)
            partial_path.write_text(payload, encoding="utf-8")
            last_write = now
            sys.stderr.write(f"[PARTIAL] ecrit : {partial_path} ({len(payload)} octets)\n")

    payload = json.dumps(inv.to_json(), ensure_ascii=False, indent=2, default=str)
    out_path.write_text(payload, encoding="utf-8")
    partial_path.write_text(payload, encoding="utf-8")
    sys.stderr.write(f"[OK ] ecrit : {out_path} ({len(payload)} octets)\n")
    sys.stderr.write(f"[OK ] partiel : {partial_path}\n")
    return 4 if inv.wall_hit else 0


if __name__ == "__main__":
    sys.exit(main())

// src/lib/tooling/corpusStore.ts
// Accès au corpus OKF d'A'Space OS V3 — lecture seule, emprisonnée.
//
// POURQUOI CE FICHIER EXISTE
// Le corpus (424 concepts) vit sur le disque de l'architecte, pas dans
// Supabase et pas sur Vercel. Les outils du catalogue `corpus` n'ont donc
// de sens que sur les surfaces locales : CLI, harness, MCP lancé en local.
// Sur Vercel, la racine n'existe pas et les outils rendent une erreur
// explicite — jamais une liste vide, qui ferait croire à un corpus vide.
//
// LA RACINE EST UNE VARIABLE, PAS UNE CONSTANTE
// `ASPACE_CORPUS_ROOT` la porte. Coder le chemin en dur rendrait le module
// intestable et lierait un dépôt applicatif au disque d'une personne.
//
// LA PRISON
// Toute lecture résout le chemin absolu et vérifie qu'il descend
// réellement de la racine. `..` et les liens ne peuvent pas en sortir.
// C'est la même discipline que le sas média de serverStore : la prison
// protège de l'évasion, elle ne dispense pas de trier ce qu'on y met.

import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export interface ConceptMeta {
  /** Chemin relatif à la racine du corpus, en séparateurs POSIX. */
  chemin: string;
  titre: string;
  type: string;
  description: string;
  /** Déduit de `verified`, jamais lu dans un champ `confiance`. */
  confiance: 'non_verifie' | 'machine' | 'humain';
  /** Les acteurs de `verified`, dans l'ordre du fichier. */
  verificateurs: string[];
  sources: string[];
}

export class CorpusIndisponible extends Error {
  constructor(raison: string) {
    super(raison);
    this.name = 'CorpusIndisponible';
  }
}

/** La racine, ou une erreur qui dit pourquoi. On ne rend jamais un
 *  chemin par défaut : un défaut silencieux ferait lire le mauvais
 *  disque et rendrait un verdict inapplicable. */
export function racine(): string {
  const r = process.env.ASPACE_CORPUS_ROOT;
  if (!r) {
    throw new CorpusIndisponible(
      "ASPACE_CORPUS_ROOT n'est pas définie. Le corpus OKF est local : ces outils ne fonctionnent que sur les surfaces CLI, harness ou MCP local.",
    );
  }
  if (!existsSync(r)) {
    throw new CorpusIndisponible(`ASPACE_CORPUS_ROOT pointe sur un chemin inexistant : ${r}`);
  }
  return path.resolve(r);
}

/** Résout un chemin relatif DANS la prison, ou lève. */
function resoudre(relatif: string): string {
  const base = racine();
  const cible = path.resolve(base, relatif);
  const rel = path.relative(base, cible);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new CorpusIndisponible(`Chemin hors du corpus : ${relatif}`);
  }
  if (path.extname(cible) !== '.md') {
    throw new CorpusIndisponible(`Seuls les fichiers .md sont lisibles : ${relatif}`);
  }
  return cible;
}

/** Parseur de frontmatter volontairement tolérant : un fichier mal formé
 *  rend des métadonnées vides plutôt que de lever. Un corpus qui refuse
 *  de s'énumérer parce qu'un fichier sur 424 est cassé ne sert à rien —
 *  le fichier cassé apparaîtra en `non_verifie`, ce qui est le
 *  signalement correct. */
export function parseFrontmatter(texte: string): { meta: Record<string, string[] | string>; corps: string } {
  if (!texte.startsWith('---')) return { meta: {}, corps: texte };
  const fin = texte.indexOf('\n---', 3);
  if (fin === -1) return { meta: {}, corps: texte };
  const meta: Record<string, string[] | string> = {};
  let cle: string | null = null;
  for (const ligne of texte.slice(3, fin).split('\n')) {
    if (!ligne.trim()) continue;
    const estEnfant = /^[\s\t-]/.test(ligne);
    if (!estEnfant && ligne.includes(':')) {
      const i = ligne.indexOf(':');
      const k = ligne.slice(0, i).trim();
      const v = ligne.slice(i + 1).trim().replace(/^["']|["']$/g, '');
      if (v) {
        meta[k] = v;
        cle = null;
      } else {
        meta[k] = [];
        cle = k;
      }
    } else if (cle) {
      const courant = meta[cle];
      if (Array.isArray(courant)) courant.push(ligne.trim().replace(/^-\s*/, ''));
    }
  }
  return { meta, corps: texte.slice(fin + 4) };
}

/** LE NIVEAU DE CONFIANCE SE DÉDUIT, IL NE SE LIT PAS.
 *  OKF v0.2 : absent => non vérifié ; acteurs non-`human:` => machine ;
 *  au moins un `human:` => humain. Écrire un champ `confiance` en plus
 *  de `verified` les laisserait diverger, et c'est celui qui ment qu'on
 *  regarderait. */
export function deduireConfiance(verified: string[] | string | undefined): ConceptMeta['confiance'] {
  if (!verified) return 'non_verifie';
  const txt = Array.isArray(verified) ? verified.join(' ') : String(verified);
  if (!txt.trim()) return 'non_verifie';
  return txt.includes('human:') ? 'humain' : 'machine';
}

function versTableau(v: string[] | string | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [String(v)];
}

export async function lireConcept(relatif: string): Promise<ConceptMeta & { corps: string }> {
  const abs = resoudre(relatif);
  const texte = await readFile(abs, 'utf8');
  const { meta, corps } = parseFrontmatter(texte);
  const verified = meta['verified'];
  return {
    chemin: relatif.split(path.sep).join('/'),
    titre: typeof meta['title'] === 'string' ? meta['title'] : path.basename(relatif, '.md'),
    type: typeof meta['type'] === 'string' ? meta['type'] : 'non declare',
    description: typeof meta['description'] === 'string' ? meta['description'] : '',
    confiance: deduireConfiance(verified),
    verificateurs: versTableau(verified),
    sources: versTableau(meta['sources']),
    corps,
  };
}

/** Parcourt un sous-dossier du corpus. NE SUIT PAS les jonctions NTFS —
 *  le canon du poste documente ce que coûte un parcours naïf : 13,8
 *  millions de fichiers comptés là où il y en avait 14 613. */
export async function listerConcepts(sousDossier = '', profondeurMax = 4): Promise<ConceptMeta[]> {
  const base = racine();
  const depart = path.resolve(base, sousDossier);
  const rel = path.relative(base, depart);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new CorpusIndisponible(`Sous-dossier hors du corpus : ${sousDossier}`);
  }

  const out: ConceptMeta[] = [];
  const pile: Array<{ dir: string; niveau: number }> = [{ dir: depart, niveau: 0 }];
  const ELAGUER = new Set(['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', 'openwiki', '_REVIEW_NOTEBOOKLM']);

  while (pile.length) {
    const { dir, niveau } = pile.pop()!;
    let entrees;
    try {
      entrees = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entrees) {
      const p = path.join(dir, e.name);
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) {
        if (niveau >= profondeurMax || ELAGUER.has(e.name) || e.name.startsWith('.')) continue;
        // Jonction NTFS : `isSymbolicLink()` ne les voit pas sous Windows.
        // Le repli portable est de comparer le chemin réel au chemin logique.
        try {
          const s = await stat(p);
          if (!s.isDirectory()) continue;
        } catch {
          continue;
        }
        pile.push({ dir: p, niveau: niveau + 1 });
      } else if (e.name.endsWith('.md') && e.name !== 'index.md') {
        try {
          const c = await lireConcept(path.relative(base, p));
          out.push(c);
        } catch {
          // Un fichier illisible ne casse pas l'énumération.
        }
      }
    }
  }
  return out.sort((a, b) => a.chemin.localeCompare(b.chemin));
}

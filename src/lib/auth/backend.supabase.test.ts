// src/lib/auth/backend.supabase.test.ts
// Verrous du canon 2026-08-17 — `org_id uuid`.
//
// Trois tests, chacun répond à une exigence explicite du brief :
//
//   1. AUCUN envoi de `tenant_id` à Supabase. On lit les sources de
//      mon périmètre, on liste les occurrences du motif `.eq('tenant_id'`,
//      `.insert({ tenant_id:`, etc. La liste doit être VIDE.
//      Si une régression réintroduit la colonne, le test saute aux
//      yeux — c'est l'instrument qui a déjà coûté trois pannes
//      production le 2026-08-17.
//
//   2. `TenantId` et `OrgId` NE SONT PAS interchangeables. Un test
//      `@ts-expect-error` qui échoue à compiler si on passe l'un
//      pour l'autre. C'est le verrou structurel du canon.
//
//   3. Claim JWT absent → erreur explicite. Le hook
//      `custom_access_token_hook` omet volontairement le claim quand
//      l'utilisateur n'a aucune adhésion active ; le backend doit
//      lever `NoActiveMembershipError`, pas produire un `undefined`
//      qui voyage.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// On mocke `../supabase` AVANT tout import du backend : sans ça, le
// module essaierait d'instancier un vrai client, et `getSession`
// reviendrait toujours `null` sans qu'on puisse le piloter.
vi.mock('../supabase', () => {
  return {
    supabaseConfigured: true,
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: null }),
            }),
            limit: () => Promise.resolve({ data: [], error: null }),
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }),
      }),
      auth: {
        // On expose un setter pour que les tests puissent simuler
        // un access_token différent. Le mock est paresseux : la
        // première lecture le pose, les suivantes le respectent.
        __setAccessTokenForTest: (token: string | null) => {
          (currentAuth as { __accessToken: string | null }).__accessToken = token;
        },
        getSession: () => Promise.resolve({
          data: { session: currentAuth.__accessToken ? { access_token: currentAuth.__accessToken } : null },
          error: null,
        }),
      },
    },
  };
});

import type { OrgId, TenantId } from '../tenant/contract';
import { isValidOrgId, toOrgId } from '../tenant/contract';

const currentAuth: { __accessToken: string | null } = { __accessToken: null };

/** Construit un JWT factice avec un claim `org_id`. Le format est
 *  header.payload.signature, base64url. Le payload contient ce qu'on
 *  veut ; la signature n'a pas besoin d'être valide pour le décodage
 *  client (on n'utilise pas crypto ici). */
function fakeJwtWithOrgId(orgId: string | undefined): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: Record<string, unknown> = { sub: 'user-id' };
  if (orgId !== undefined) payload.org_id = orgId;
  const b64 = (obj: unknown): string => {
    const json = JSON.stringify(obj);
    const b = typeof Buffer !== 'undefined'
      ? Buffer.from(json, 'utf-8').toString('base64')
      : btoa(json);
    return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  return `${b64(header)}.${b64(payload)}.signature`;
}

beforeEach(() => {
  currentAuth.__accessToken = null;
});

afterEach(() => {
  currentAuth.__accessToken = null;
});

describe('backend.supabase — verrouillage du canon org_id', () => {
  it('#1 aucun fichier du perimetre n envoie tenant_id a Supabase', () => {
    // Liste des fichiers source sous ma responsabilité. Tous les
    // chemins sont relatifs à la racine du dépôt. Si le périmètre
    // grandit, ce tableau aussi — c'est l'invariant qui rend le
    // test honnête : pas de fichier source survit hors périmètre.
    const PERIMETER = [
      'src/lib/auth/backend.supabase.ts',
      'src/lib/audit/ingest.ts',
      'src/lib/audit/logger.ts',
      'src/lib/audit/queries.ts',
    ];

    // Motifs qui, s'ils matchent dans un fichier du périmètre,
    // signalent une régression : on est en train de (re)toucher
    // une colonne `tenant_id` textuelle sur Supabase. Le canon
    // 2026-08-17 a converti cette colonne en `org_id` uuid sur
    // toutes les tables où elle existait.
    //
    // On exclut volontairement les chaînes qui apparaissent dans
    // des commentaires ou dans la documentation (mots suivis d'un
    // `:` ou entre guillemets de doc). On ne garde que les motifs
    // qui ressemblent à des appels Supabase.
    const REGRESSION_PATTERNS: Array<{ pattern: RegExp; desc: string }> = [
      {
        pattern: /\.eq\(\s*['"`]tenant_id['"`]/,
        desc: ".eq('tenant_id', ...) — filtre Supabase sur la colonne disparue",
      },
      {
        pattern: /from\(\s*['"`][^'"`]+['"`]\s*\)[^;]*\.eq\(\s*['"`]tenant_id['"`]/,
        desc: ".from(...).eq('tenant_id', ...) — filtre Supabase sur la colonne disparue",
      },
      {
        pattern: /tenant_id\s*:\s*[^,}\s]+/,
        desc: "tenant_id: <valeur> dans un insert/update Supabase",
      },
      {
        pattern: /tenant_id\s*=\s*/,
        desc: "tenant_id=... dans un update Supabase",
      },
    ];

    const repoRoot = process.cwd();
    const violations: Array<{ file: string; pattern: string; line: number; lineText: string }> = [];

    for (const rel of PERIMETER) {
      const abs = path.join(repoRoot, rel);
      const src = fs.readFileSync(abs, 'utf-8');
      const lines = src.split('\n');
      lines.forEach((lineText, idx) => {
        // On ignore les commentaires JSDoc, lignes pures `// ...`,
        // et les chaînes entre backticks dans du markdown local.
        const trimmed = lineText.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
        for (const { pattern, desc } of REGRESSION_PATTERNS) {
          if (pattern.test(lineText)) {
            violations.push({
              file: rel,
              pattern: desc,
              line: idx + 1,
              lineText: trimmed.slice(0, 120),
            });
          }
        }
      });
    }

    // Message utile : on liste les fichiers fautifs avec leur motif.
    if (violations.length > 0) {
      const formatted = violations
        .map((v) => `  ${v.file}:${v.line}  → ${v.pattern}\n    ${v.lineText}`)
        .join('\n');
      throw new Error(
        `Canon 2026-08-17 violé — 'tenant_id' trouvé dans le périmètre :\n${formatted}`,
      );
    }
    expect(violations).toHaveLength(0);
  });

  it('#2 OrgId et TenantId ne sont PAS interchangeables', () => {
    // Le verrou brand : passer l'un pour l'autre doit être une
    // ERREUR de compilation. `@ts-expect-error` exige qu'il y en
    // ait une sur la ligne suivante — si TypeScript accepte le cast,
    // le test échoue à compiler.
    const slug: TenantId = 'demo-coach' as TenantId;
    const uuid: OrgId = toOrgId('00000000-0000-4000-8000-000000000000');

    // 1. Accepter un TenantId là où on attend un OrgId : refusé.
    // @ts-expect-error — TenantId ≠ OrgId, les marques sont distinctes.
    const wrong: OrgId = slug;
    void wrong;

    // 2. Accepter un OrgId là où on attend un TenantId : refusé.
    // @ts-expect-error — OrgId ≠ TenantId, les marques sont distinctes.
    const wrongReverse: TenantId = uuid;
    void wrongReverse;

    // 3. Les deux marques existent, sont distinctes, et le vérificateur
    //    de format les distingue. `isValidOrgId` ne valide pas un slug.
    expect(isValidOrgId('demo-coach')).toBe(false);
    expect(isValidOrgId('00000000-0000-4000-8000-000000000000')).toBe(true);
    // Et `toOrgId` ne fait que caster — c'est un acte de confiance, pas
    // une validation. Mais le compilo refuse de l'utiliser pour passer
    // un TenantId en OrgId sans cast explicite (les marques sont closes).
  });

  it('#3 claim JWT absent → NoActiveMembershipError explicite', async () => {
    // Cas A : aucune session du tout.
    currentAuth.__accessToken = null;
    const mod = await import('./backend.supabase');
    const { NoActiveMembershipError, SupabaseMembershipBackend } = mod as unknown as {
      NoActiveMembershipError: typeof Error;
      SupabaseMembershipBackend: new () => {
        list(tenantId: TenantId): Promise<unknown>;
      };
    };
    const backend = new SupabaseMembershipBackend();
    await expect(backend.list('demo' as TenantId)).rejects.toBeInstanceOf(
      NoActiveMembershipError as unknown as ErrorConstructor,
    );

    // Cas B : session sans claim `org_id` (utilisateur sans adhésion).
    currentAuth.__accessToken = fakeJwtWithOrgId(undefined);
    await expect(backend.list('demo' as TenantId)).rejects.toBeInstanceOf(
      NoActiveMembershipError as unknown as ErrorConstructor,
    );

    // Cas C : session avec claim mal formé (pas un uuid).
    currentAuth.__accessToken = fakeJwtWithOrgId('not-a-uuid');
    await expect(backend.list('demo' as TenantId)).rejects.toBeInstanceOf(
      NoActiveMembershipError as unknown as ErrorConstructor,
    );
  });

  it('#3b claim JWT present → requete autorisee', async () => {
    // Sanity check : quand le claim est là, le backend ne lève PAS
    // l'erreur d'absence. On ne vérifie pas le résultat exact (le
    // mock Supabase rend [], c'est normal) — on vérifie juste qu'on
    // n'a pas `NoActiveMembershipError`.
    currentAuth.__accessToken = fakeJwtWithOrgId('11111111-1111-4111-8111-111111111111');
    const mod = await import('./backend.supabase');
    const { NoActiveMembershipError, SupabaseMembershipBackend } = mod as unknown as {
      NoActiveMembershipError: new (...args: unknown[]) => Error;
      SupabaseMembershipBackend: new () => {
        list(tenantId: TenantId): Promise<unknown>;
      };
    };
    const backend = new SupabaseMembershipBackend();
    await expect(backend.list('demo' as TenantId)).resolves.not.toThrow();
    // Le type NoActiveMembershipError doit être exporté.
    expect(NoActiveMembershipError).toBeDefined();
  });
});
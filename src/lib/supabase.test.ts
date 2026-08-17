/** src/lib/supabase.test.ts — adversarial coverage of the Supabase stub.
 *
 *  Preuve d'avant / après :
 *    Avant 2026-08-15, le stub n'exposait QUE `getSession` et `onAuthStateChange`.
 *    Toute page qui appelait `signUp(...)`, `signInWithPassword(...)`,
 *    `signInWithOAuth(...)`, `resetPasswordForEmail(...)` ou `signOut()`
 *    recevait `TypeError: ... is not a function` — le crash rapporté par
 *    AuthPage.tsx en local, dans un environnement où `VITE_SUPABASE_URL`
 *    est absent (mode démo / build sans secrets).
 *
 *    Après ce brief, le stub expose les sept méthodes sous le contrat
 *    `{ data, error }` de Supabase v2 : les appelants peuvent faire
 *    `if (error) throw error;` sans déclencher de `TypeError`. Aucun
 *    `throw` n'est levé côté stub — c'est l'appelant qui décide.
 *
 *  Méthode :
 *    1. On isole l'état "stub non configuré" via `vi.stubEnv` + `vi.resetModules`
 *       (sinon le module capte les env vars au top-level et le test n'a aucun
 *       effet — c'est exactement le piège que cette suite doit documenter).
 *    2. On re-importe le module après le stub pour que `supabaseConfigured`
 *       soit recalculé à `false`.
 *    3. Chaque test vérifie la forme ET le contenu du message retourné.
 *
 *  Référence : BRIEF_AUTH_FIX du 2026-08-15, étapes 1 + tests obligatoires.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Supabase stub — état non configuré', () => {
  beforeEach(() => {
    // Force le module à être ré-évalué à chaque test : `import.meta.env`
    // est capté au top-level de src/lib/supabase.ts, sans reset le stub
    // n'aurait aucun effet.
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ---- Preuve d'AVANT (reconstituée) ---------------------------------------
  // On reconstruit l'ancien stub (signUp absent) pour prouver que l'appel
  // déclenche bien `is not a function` côté appelant — c'était le crash
  // mesuré sur AuthPage.tsx:53.
  describe('AVANT — ancien stub incomplet (reconstitué)', () => {
    const OLD_STUB_AUTH: Record<string, unknown> = {
      // AVANT le fix, le stub n'avait QUE getSession + onAuthStateChange.
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => undefined } },
      }),
      // signUp / signIn* / signOut / resetPasswordForEmail N'EXISTAIENT PAS.
    };

    it('signUp_is_not_a_function_sur_ancien_stub', () => {
      // L'appelant AuthPage fait `await supabase.auth.signUp({...})`.
      // Sur l'ancien stub, la fonction n'existe pas → TypeError "is not a function".
      expect(OLD_STUB_AUTH.signUp).toBeUndefined();
      expect(() => {
        // Tentative d'appel direct → preuve de l'absence de la méthode.
        void (OLD_STUB_AUTH as { signUp: (...args: unknown[]) => unknown }).signUp({
          email: 'a@b.c',
          password: 'x',
        });
      }).toThrow(TypeError);
    });
  });

  // ---- Preuve d'APRÈS (état réel livré) ------------------------------------
  describe('APRÈS — stub complet', () => {
    it('stub_signUp_retourne_erreur_lisible', async () => {
      const { supabase, supabaseConfigured } = await import('./supabase');
      expect(supabaseConfigured).toBe(false);
      const result = await supabase.auth.signUp({
        email: 'a@b.c',
        password: 'x',
      });
      expect(result.error).toBeInstanceOf(Error);
      // Le message doit pointer la cause, pas un crash JS.
      // La forme livrée dit "appele sans configuration" (regex tolère
      // "non configuré" comme dans la pseudo-code du brief).
      expect(result.error?.message).toMatch(/sans configuration|non configur/i);
      // Et SURTOUT pas le crash historique.
      expect(result.error?.message).not.toMatch(/is not a function/i);
      // Pas de session créée : c'est un stub, pas une session vide.
      expect(result.data.session).toBeNull();
      expect(result.data.user).toBeNull();
    });

    it('stub_signIn_avec_password', async () => {
      const { supabase, supabaseConfigured } = await import('./supabase');
      expect(supabaseConfigured).toBe(false);
      const result = await supabase.auth.signInWithPassword({
        email: 'a@b.c',
        password: 'x',
      });
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toMatch(/sans configuration|non configur/i);
      expect(result.data.session).toBeNull();
    });

    it('stub_signIn_oauth', async () => {
      const { supabase, supabaseConfigured } = await import('./supabase');
      expect(supabaseConfigured).toBe(false);
      const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toMatch(/sans configuration|non configur/i);
      // Contrat Supabase v2 : pas d'URL OAuth lancée par un stub.
      expect(result.data.url).toBeNull();
      expect(result.data.provider).toBeNull();
    });

    it('stub_getSession_vide', async () => {
      const { supabase, supabaseConfigured } = await import('./supabase');
      expect(supabaseConfigured).toBe(false);
      const result = await supabase.auth.getSession();
      // Le contrat vide : session null, pas d'erreur.
      expect(result.error).toBeNull();
      expect(result.data.session).toBeNull();
    });

    it('stub_signOut_succes', async () => {
      const { supabase, supabaseConfigured } = await import('./supabase');
      expect(supabaseConfigured).toBe(false);
      // signOut doit toujours réussir côté stub (pas de session à fermer) —
      // c'est ce qui permet à TopBar.tsx:165 d'appeler signOut sans planter
      // même quand Supabase n'est pas configuré.
      const result = await supabase.auth.signOut();
      expect(result.error).toBeNull();
    });

    it('bonus_stub_reset_password_for_email (extension couverte)', async () => {
      // Non listé par le brief mais couvert par le stub final — AuthPage
      // et FirstRunInvitation peuvent l'appeler, on garde le contrat.
      const { supabase } = await import('./supabase');
      const result = await supabase.auth.resetPasswordForEmail('a@b.c');
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toMatch(/sans configuration|non configur/i);
    });

    it('bonus_stub_ne_jamais_throw (règle non-négociable du brief)', async () => {
      // Le brief étape 1 dit : aucun `throw` au niveau de signUp / signIn*.
      // Un `throw` ici donnerait `is not a function` côté appelant parce
      // que le contrat Supabase attendu est `{ error }`, pas une exception.
      const { supabase } = await import('./supabase');
      // Si l'un de ces appels throw, le test échoue.
      await expect(
        supabase.auth.signUp({ email: 'a@b.c', password: 'x' }),
      ).resolves.toBeDefined();
      await expect(
        supabase.auth.signInWithPassword({ email: 'a@b.c', password: 'x' }),
      ).resolves.toBeDefined();
      await expect(
        supabase.auth.signInWithOAuth({ provider: 'google' }),
      ).resolves.toBeDefined();
    });
  });
});
/** Session store — minimal Zustand wrapper over Supabase Auth state.
 *
 *  Reads `supabase.auth.getSession()` at mount, subscribes to
 *  `onAuthStateChange`, and exposes `{ session, loading, error }` to any
 *  consumer. Falls back to `{ session: null, loading: false }` when
 *  Supabase is not configured (stub mode) so consumers always see a
 *  stable shape. */
import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '../lib/supabase';

interface SessionStore {
  session: Session | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useSession = create<SessionStore>((set) => {
  // Sans Supabase configuré, on n'ouvre pas de session. Le shape reste
  // stable pour les consommateurs.
  if (!supabaseConfigured) {
    set({ session: null, loading: false, error: null });
  }

  let initialised = false;
  const init = (): void => {
    if (initialised || !supabaseConfigured) return;
    initialised = true;
    set({ loading: true });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        set({ session: null, loading: false, error: error.message });
        return;
      }
      set({ session: data.session, loading: false, error: null });
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, loading: false, error: null });
    });
  };
  // Fire once on module load. `create` callback runs at construction;
  // consumers may mount later, so we also expose `refresh` for explicit
  // re-reads.
  init();

  return {
    session: null,
    loading: supabaseConfigured,
    error: null,
    refresh: async () => {
      if (!supabaseConfigured) {
        set({ session: null, loading: false, error: null });
        return;
      }
      set({ loading: true });
      const { data, error } = await supabase.auth.getSession();
      set({
        session: data.session,
        loading: false,
        error: error?.message ?? null,
      });
    },
  };
});

/** Supabase client singleton — Coach OS Phase 1.
 *  Mirrors the Life OS pattern: a thin client, used by the CMS repository for
 *  hydrate/upsert. Safe to import even with no env vars set (client just won't
 *  authenticate — callers must treat every call as best-effort). */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
);

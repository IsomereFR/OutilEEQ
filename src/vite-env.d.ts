/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL du projet Supabase (synchro multi-poste, optionnelle). */
  readonly VITE_SUPABASE_URL?: string;
  /** Clé publique (anon) Supabase. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ============================================================================
//  Synchronisation multi-poste OPTIONNELLE via Supabase.
//  Activée uniquement si VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont
//  définies (variables d'environnement). Sans elles, l'application reste
//  100 % locale (IndexedDB) comme avant.
//  Modèle : une table `eeq_config` avec une ligne unique { id, data (jsonb) }.
//  L'IndexedDB sert de cache hors-ligne ; Supabase est la source partagée.
// ============================================================================
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AppData } from '../domain/types';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** La synchro multi-poste est-elle configurée ? */
export const syncActif: boolean = Boolean(URL && KEY);

const client: SupabaseClient | null = syncActif ? createClient(URL as string, KEY as string) : null;

const TABLE = 'eeq_config';
const ID = 'singleton';

/** Charge la configuration partagée depuis Supabase (null si absente). */
export async function chargerDistant(): Promise<AppData | null> {
  if (!client) return null;
  const { data, error } = await client.from(TABLE).select('data').eq('id', ID).maybeSingle();
  if (error) throw error;
  return (data?.data as AppData | undefined) ?? null;
}

/** Écrit la configuration partagée dans Supabase (upsert de la ligne unique). */
export async function sauverDistant(d: AppData): Promise<void> {
  if (!client) return;
  const { error } = await client
    .from(TABLE)
    .upsert({ id: ID, data: d, updated_at: new Date().toISOString() });
  if (error) throw error;
}

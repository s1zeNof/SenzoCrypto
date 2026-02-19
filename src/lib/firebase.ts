/**
 * lib/firebase.ts — MIGRATED TO SUPABASE
 * This file is kept for backward-compat imports (e.g. src/lib/xp.ts used `db` from here).
 * All exports now point to the Supabase client.
 */
export { supabase as db, supabase as auth } from '@/lib/supabase'
export { default as supabase } from '@/lib/supabase'

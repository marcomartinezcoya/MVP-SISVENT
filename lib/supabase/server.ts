import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────
//  Cliente Supabase para uso en el SERVIDOR
//  (server actions, API routes)
// ─────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Se crea una nueva instancia por request para server actions
// (evita compartir estado entre requests en producción)
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

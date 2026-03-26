import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────
//  Cliente Supabase para uso en el BROWSER
//  (componentes cliente, uploads desde el modal)
// ─────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);

// lib/supabase-external.ts
import { createClient } from '@supabase/supabase-js';

const externalSupabaseUrl = process.env.NEXT_PUBLIC_EXTERNAL_SUPABASE_URL;
const externalSupabaseAnonKey = process.env.NEXT_PUBLIC_EXTERNAL_SUPABASE_ANON_KEY;

if (!externalSupabaseUrl || !externalSupabaseAnonKey) {
  console.warn("⚠️ Credenciais do Supabase Externo não foram encontradas.");
}

// Inicializa e exporta o cliente do SEGUNDO banco
export const supabaseExternal = createClient(
  externalSupabaseUrl || '',
  externalSupabaseAnonKey || ''
);
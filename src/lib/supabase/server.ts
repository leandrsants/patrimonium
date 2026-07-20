import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase server-side, usando a service_role local.
 *
 * NUNCA importar este arquivo em um Client Component ou expor a chave ao
 * navegador -- "server-only" garante isso em tempo de build. E uma ponte
 * temporaria para leitura de catalogo/seeds enquanto nao existe login real
 * no app; deve ser revisitado quando a autenticacao for implementada.
 */
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

import { createClient } from "@supabase/supabase-js";

// Cliente con permisos de administrador — SOLO para usar en el backend (API routes),
// nunca en componentes del navegador. Salta las reglas de seguridad (RLS).
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

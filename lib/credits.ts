import { createServiceClient } from "./supabase/service";

// Sistema de creditos compartido con Social Red: apunta a las MISMAS tablas y
// funciones de Postgres (spend_credit / grant_credit) del Supabase comun. No es
// una copia de la logica — es un cliente a la unica fuente de verdad en la base.
// 1 credito = 1 imagen. El texto/plan estrategico NO gasta creditos.

// Consulta el saldo actual de imagenes de un usuario
export async function obtenerSaldo(userId: string): Promise<number> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("credit_balance")
    .select("saldo")
    .eq("user_id", userId)
    .single();
  return data?.saldo ?? 0;
}

// Gasta creditos de forma atomica (via funcion de Postgres). Devuelve false si no alcanzo el saldo.
export async function gastarCredito(
  userId: string,
  cantidad: number,
  origen: string,
  origenId?: string
): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("spend_credit", {
    p_user_id: userId,
    p_cantidad: cantidad,
    p_origen: origen,
    p_origen_id: origenId ?? null,
  });
  if (error) throw error;
  return data as boolean;
}

// Otorga creditos (renovacion de plan, compra de pack, ajuste manual)
export async function otorgarCredito(
  userId: string,
  cantidad: number,
  tipo: string,
  origen: string,
  origenId?: string,
  nota?: string
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.rpc("grant_credit", {
    p_user_id: userId,
    p_cantidad: cantidad,
    p_tipo: tipo,
    p_origen: origen,
    p_origen_id: origenId ?? null,
    p_nota: nota ?? null,
  });
  if (error) throw error;
}

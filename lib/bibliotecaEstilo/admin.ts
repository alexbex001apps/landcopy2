// Chequea si un email tiene permiso para administrar la Biblioteca de Estilo
// (banco global). Mismo patron que Meta Pixel: nada de tabla de roles, solo env var.
export function esAdminBibliotecaEstilo(email?: string | null): boolean {
  if (!email) return false;
  const admins = (process.env.BIBLIOTECA_ESTILO_ADMINS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

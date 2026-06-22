"use client";
import { createClient } from "@/lib/supabase/client";

export default function Espera() {
  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <a href="/" className="text-2xl font-bold text-white">Land<span className="text-orange-500">Copy</span></a>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mt-8">
          <div className="text-5xl mb-5">⏳</div>
          <h1 className="text-white font-bold text-2xl mb-4">Tu cuenta está en revisión</h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-2">
            ¡Gracias por registrarte en LandCopy! Estamos revisando tu cuenta.
          </p>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            Te contactaremos por <span className="text-green-400 font-medium">WhatsApp</span> muy pronto para darte la bienvenida y activar tu acceso.
          </p>
          <button onClick={salir} className="text-zinc-500 text-sm hover:text-white transition-colors">
            Cerrar sesión
          </button>
        </div>
        <p className="text-zinc-600 text-xs mt-6">¿Ya te activaron? Cierra sesión y vuelve a entrar.</p>
      </div>
    </div>
  );
}
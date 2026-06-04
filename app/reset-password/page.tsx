"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleReset = async () => {
    if (!password || !confirmar) { setError("Completa ambos campos."); return; }
    if (password !== confirmar) { setError("Las contraseñas no coinciden."); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    setCargando(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setCargando(false); return; }
    setMensaje("✅ Contraseña actualizada. Redirigiendo...");
    setTimeout(() => router.push("/copy"), 2000);
    setCargando(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8 w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-black text-white">Nueva <span className="text-orange-500">contraseña</span></h1>
          <p className="text-yellow-400 text-sm mt-2">Elige una contraseña segura</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-yellow-400 text-[10px] font-bold uppercase tracking-wider">Nueva contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label className="text-yellow-400 text-[10px] font-bold uppercase tracking-wider">Confirmar contraseña</label>
            <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="Repite la contraseña" />
          </div>
        </div>
        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        {mensaje && <p className="text-green-400 text-xs text-center">{mensaje}</p>}
        <button onClick={handleReset} disabled={cargando} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors text-sm">
          {cargando ? "Actualizando..." : "Cambiar contraseña"}
        </button>
      </div>
    </div>
  );
}
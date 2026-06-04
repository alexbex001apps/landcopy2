"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Login() {
  const supabase = createClient();
  const router = useRouter();
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Correo o contraseña incorrectos");
    } else {
      router.replace("/copy");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleRegistro() {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setError("Revisa tu correo para confirmar tu cuenta");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-bold text-white">Land<span className="text-orange-500">Copy</span></a>
          <p className="text-zinc-400 mt-2">Entra a tu cuenta o crea una nueva</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="flex gap-2 mb-8">
            <button onClick={() => setModo("login")} className={`flex-1 font-medium py-2 rounded-lg text-sm transition-colors ${modo === "login" ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}>Entrar</button>
            <button onClick={() => setModo("registro")} className={`flex-1 font-medium py-2 rounded-lg text-sm transition-colors ${modo === "registro" ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}>Registrarse</button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">Correo electrónico</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors" />
            </div>
            {error && <p className={`text-sm ${error.includes("correo") && !error.includes("incorrecto") ? "text-green-400" : "text-red-400"}`}>{error}</p>}
            <button onClick={modo === "login" ? handleLogin : handleRegistro} disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
              {loading ? "Cargando..." : modo === "login" ? "Entrar" : "Crear cuenta"}
            </button>
            {modo === "login" && (
              <button onClick={async () => {
                if (!email) { setError("Escribe tu correo primero."); return; }
                const supabase = createClient();
                await supabase.auth.resetPasswordForEmail(email, { redirectTo: "https://landcopy2.vercel.app/reset-password" });
                setError("✅ Te enviamos un correo para recuperar tu contraseña.");
              }} className="w-full text-yellow-400 text-xs font-bold py-1 hover:text-orange-500 transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
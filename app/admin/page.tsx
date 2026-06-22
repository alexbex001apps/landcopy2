"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Usuario = {
  id: string;
  email: string;
  plan: string;
  whatsapp: string | null;
};

const PLANES = ["inicial", "pro", "completo"];
const COLORES: Record<string, string> = {
  inicial: "#facc15", pro: "#ff5000", completo: "#25d366", sin_acceso: "#e5484d",
};

export default function Admin() {
  const supabase = createClient();
  const [cargando, setCargando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }
      const { data: yo } = await supabase.from("users").select("es_admin").eq("id", session.user.id).single();
      if (!yo || !yo.es_admin) { window.location.href = "/copy"; return; }
      setAutorizado(true);
      const { data } = await supabase.from("users").select("id, email, plan, whatsapp").order("email");
      setUsuarios(data || []);
      setCargando(false);
    }
    init();
  }, []);

  async function cambiarPlan(id: string, plan: string, email: string) {
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, plan } : u));
    await supabase.from("users").update({ plan }).eq("id", id);
    setToast(plan === "sin_acceso" ? `${email} quedó sin acceso` : `${email} ahora es ${plan}`);
    setTimeout(() => setToast(""), 2500);
  }

  if (cargando) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><p className="text-zinc-600 text-sm">Cargando…</p></div>;
  }
  if (!autorizado) return null;

  const filtrados = usuarios.filter(u => (u.email || "").toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-yellow-400 font-bold text-base">LandCopy</span>
          <span className="bg-[#ff5000] text-white text-[10px] px-2 py-0.5 rounded-md">Admin</span>
        </div>
        <h1 className="text-white text-lg font-medium">Planes de usuarios</h1>
        <p className="text-zinc-500 text-xs mb-4">Toca el plan que quieres darle a cada quien</p>

        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por correo…"
          className="w-full bg-[#0d0d0d] border border-[#222] rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 outline-none focus:border-orange-500 mb-4"
        />

        <div className="space-y-3">
          {filtrados.map(u => (
            <div key={u.id} className="bg-[#0d0d0d] border border-[#222] rounded-2xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0">
                  <div className="text-white text-sm font-medium truncate">{u.email}</div>
                  {u.whatsapp && (
                    <a href={`https://wa.me/${u.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" className="text-green-400 text-xs flex items-center gap-1 mt-0.5">
                      📱 {u.whatsapp}
                    </a>
                  )}
                </div>
                <span className="text-[11px] flex-shrink-0 ml-2" style={{ color: COLORES[u.plan] || "#888" }}>
                  {u.plan}
                </span>
              </div>
              <div className="flex gap-1.5">
                {PLANES.map(p => (
                  <button key={p} onClick={() => cambiarPlan(u.id, p, u.email)}
                    className="flex-1 text-[11px] font-medium py-2 rounded-lg capitalize transition-all"
                    style={u.plan === p
                      ? { background: COLORES[p], color: p === "completo" ? "#073d1c" : p === "inicial" ? "#000" : "#fff" }
                      : { background: "transparent", color: "#888", border: "1px solid #333" }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => cambiarPlan(u.id, "sin_acceso", u.email)}
                  className="text-[11px] font-medium py-2 px-3 rounded-lg transition-all flex-shrink-0"
                  style={u.plan === "sin_acceso"
                    ? { background: "#e5484d", color: "#fff" }
                    : { background: "transparent", color: "#e5484d", border: "1px solid #5c2326" }}>
                  Sin acceso
                </button>
              </div>
            </div>
          ))}
        </div>

        {toast && (
          <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto bg-green-500 text-green-950 text-sm font-medium text-center py-3 rounded-xl">
            ✓ {toast}
          </div>
        )}
      </div>
    </div>
  );
}
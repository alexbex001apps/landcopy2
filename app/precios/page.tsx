"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Plan = {
  id: string;
  slug: string;
  nombre: string;
  precio_centavos: number;
  moneda: string;
  intervalo: string;
  imagenes_incluidas: number;
  es_popular: boolean;
};

type Pack = {
  id: string;
  slug: string;
  nombre: string;
  imagenes: number;
  precio_centavos: number;
  moneda: string;
};

function precio(centavos: number): string {
  return `$${(centavos / 100).toFixed(0)}`;
}

// Lo que cada plan destaca, mas alla del numero de imagenes.
const BENEFICIOS: Record<string, string[]> = {
  starter: [
    "Campañas de hasta 30 días",
    "Los 3 modos: producto, negocio y marca",
    "Historial completo de tus campañas",
  ],
  pro: [
    "Todo lo de Starter",
    "Para quien publica cada semana",
    "Rinde para 3 o 4 campañas al mes",
  ],
  agency: [
    "Todo lo de Pro",
    "Pensado para manejar varios clientes",
    "Volumen de agencia sin quedarte corto",
  ],
};

export default function PreciosPage() {
  const router = useRouter();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [cargando, setCargando] = useState(true);
  const [saldo, setSaldo] = useState<number | null>(null);
  const [planActual, setPlanActual] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase.from("plans").select("*").eq("activo", true).order("orden"),
      supabase.from("topup_packs").select("*").eq("activo", true).order("orden"),
    ]).then(([resPlanes, resPacks]) => {
      if (resPlanes.data) setPlanes(resPlanes.data as Plan[]);
      if (resPacks.data) setPacks(resPacks.data as Pack[]);
      setCargando(false);
    });

    // Si hay sesion, mostramos cuantas imagenes le quedan y en que plan esta.
    fetch("/api/billing/estado")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setSaldo(typeof d.saldo === "number" ? d.saldo : null);
        setPlanActual(d.suscripcion?.plan?.slug || null);
      })
      .catch(() => {});
  }, []);

  async function comprar(tipo: "plan" | "pack", slug: string) {
    setProcesando(slug);
    setAviso(null);
    try {
      const ruta = tipo === "plan" ? "/api/billing/checkout-suscripcion" : "/api/billing/checkout-topup";
      const cuerpo = tipo === "plan" ? { planSlug: slug } : { packSlug: slug };

      const resp = await fetch(ruta, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });

      let data: any = {};
      try { data = await resp.json(); } catch {}

      if (resp.status === 401) {
        router.push("/login");
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      // 503 = todavia no estan cargados los productos del proveedor de pagos.
      setAviso(
        resp.status === 503
          ? "Los pagos se habilitan muy pronto. Escríbenos y te damos acceso mientras tanto."
          : data.error || "No se pudo abrir el pago. Intenta de nuevo en un momento."
      );
    } catch {
      setAviso("No se pudo abrir el pago. Revisa tu conexión e intenta de nuevo.");
    }
    setProcesando(null);
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F0E8] px-4 py-10 sm:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Volver */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-white/60 hover:text-white border border-white/10 rounded-full px-4 py-2"
          >
            Volver
          </button>
        </div>

        {/* Encabezado */}
        <div className="text-center mb-12">
          <img src="/logo.png" alt="Social Red" className="h-14 w-auto mx-auto mb-6" />
          <div
            className="inline-block text-[10px] font-black tracking-[0.2em] uppercase px-4 py-1.5 rounded-full mb-5"
            style={{ background: "linear-gradient(90deg,#ff5000,#a855f7)" }}
          >
            Planes
          </div>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-4">
            Tu <span className="text-[#FFF500]">Director de Marketing</span>
            <br className="hidden sm:block" /> trabajando todo el mes
          </h1>
          <p className="text-white/50 text-base max-w-2xl mx-auto leading-relaxed">
            Diseña campañas completas, coherentes y listas para publicar. Elige según cuántas
            imágenes necesites generar.
          </p>
        </div>

        {/* Lo que no cuesta: el argumento fuerte */}
        <div className="bg-[#0a0a0a] border border-[rgba(255,245,0,0.2)] rounded-2xl p-6 mb-12 text-center">
          <p className="text-[#FFF500] font-black text-sm tracking-widest uppercase mb-3">
            Incluido en todos los planes
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-white/70">
            <span>✓ Campañas estratégicas completas</span>
            <span>✓ Copys, guiones y calendario</span>
            <span>✓ Leonel, tu asesor de marketing</span>
            <span>✓ Tu Biblioteca de campañas</span>
          </div>
          <p className="text-white/40 text-xs mt-4">
            Tu cupo mensual se mide en imágenes generadas con IA.
          </p>
        </div>

        {/* Saldo actual */}
        {saldo !== null && (
          <div className="text-center mb-10">
            <span className="text-sm text-white/50">
              Te quedan <strong className="text-white">{saldo}</strong>{" "}
              {saldo === 1 ? "imagen" : "imágenes"}
              {planActual ? " en tu plan actual" : ""}.
            </span>
          </div>
        )}

        {aviso && (
          <div className="max-w-2xl mx-auto bg-[#1a1200] border border-[rgba(255,200,0,0.3)] rounded-xl p-4 mb-10 text-center text-sm text-[#FFF500]">
            {aviso}
          </div>
        )}

        {cargando ? (
          <p className="text-center text-white/40 text-sm py-16">Cargando planes...</p>
        ) : (
          <>
            {/* Planes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start mb-16">
              {planes.map((p) => {
                const esActual = planActual === p.slug;
                return (
                  <div
                    key={p.id}
                    className={`relative rounded-2xl p-6 flex flex-col ${
                      p.es_popular
                        ? "bg-[#0d0d0d] border-2 border-[#FFF500] md:-mt-4 md:pb-10"
                        : "bg-[#0a0a0a] border border-[#1a1a1a]"
                    }`}
                  >
                    {p.es_popular && (
                      <div
                        className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full text-[#0d0d0d]"
                        style={{ background: "linear-gradient(90deg,#FFF500,#ffcc00)" }}
                      >
                        Más popular
                      </div>
                    )}

                    <div className="text-sm font-black tracking-widest uppercase text-white/50 mb-3">
                      {p.nombre}
                    </div>

                    <div className="flex items-end gap-1 mb-1">
                      <span className="text-5xl font-black text-white">{precio(p.precio_centavos)}</span>
                      <span className="text-white/40 text-sm mb-2">/mes</span>
                    </div>

                    <div className="text-[#FFF500] font-bold text-sm mb-5">
                      {p.imagenes_incluidas} imágenes al mes
                    </div>

                    <ul className="flex flex-col gap-2.5 mb-7 text-sm text-white/60">
                      {(BENEFICIOS[p.slug] || []).map((b, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-[#FFF500] shrink-0">✓</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => comprar("plan", p.slug)}
                      disabled={procesando === p.slug || esActual}
                      className={`mt-auto w-full rounded-xl py-3.5 text-sm font-black transition-all disabled:opacity-50 ${
                        p.es_popular
                          ? "text-[#0d0d0d] hover:brightness-110"
                          : "bg-white/10 hover:bg-white/15 text-white"
                      }`}
                      style={p.es_popular ? { background: "linear-gradient(90deg,#FFF500,#ffcc00)" } : {}}
                    >
                      {esActual
                        ? "Tu plan actual"
                        : procesando === p.slug
                        ? "Abriendo..."
                        : "Elegir " + p.nombre}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Packs sueltos */}
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-xl font-black mb-2">¿Solo necesitas unas cuantas más?</h2>
                <p className="text-white/50 text-sm">
                  Compra imágenes sueltas sin cambiar de plan. No se vencen.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {packs.map((pk) => (
                  <div
                    key={pk.id}
                    className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-2xl font-black text-white">
                        {pk.imagenes} <span className="text-sm font-bold text-white/50">imágenes</span>
                      </div>
                      <div className="text-white/40 text-xs mt-0.5">Pago único</div>
                    </div>
                    <button
                      onClick={() => comprar("pack", pk.slug)}
                      disabled={procesando === pk.slug}
                      className="shrink-0 bg-white/10 hover:bg-white/15 rounded-xl px-5 py-3 text-sm font-black disabled:opacity-50"
                    >
                      {procesando === pk.slug ? "..." : precio(pk.precio_centavos)}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-white/30 text-xs mt-14">
              Precios en dólares. Cancela cuando quieras.{" "}
              <a href="/terminos" className="underline hover:text-white/60">Términos</a>
              {" · "}
              <a href="/privacidad" className="underline hover:text-white/60">Privacidad</a>
              {" · "}
              <a href="mailto:hola@socialred.app" className="underline hover:text-white/60">hola@socialred.app</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

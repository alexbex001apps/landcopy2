"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function colorSalud(v: number) {
  if (v >= 7) return "#639922";
  if (v >= 5) return "#EF9F27";
  return "#E24B4A";
}

export default function MastermindPage() {
  const router = useRouter();
  const [landing, setLanding] = useState("");
  const [imagen, setImagen] = useState<string | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState("");

  const subirImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagen(reader.result as string);
    reader.readAsDataURL(file);
  };

  const analizar = async () => {
    if (!landing.trim() && !imagen) return;
    setAnalizando(true);
    setError("");
    setResultado(null);
    try {
      const resp = await fetch("/api/mastermind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landing, imagen }),
      });
      const data = await resp.json();
      if (data.analisis) {
        setResultado(data.analisis);
      } else {
        setError(data.error || "No se pudo analizar");
      }
    } catch {
      setError("Error de conexión");
    }
    setAnalizando(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-3xl">

        {/* Cabecera */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "#FAECE7" }}>
              <span className="text-xl">🔥</span>
            </div>
            <div>
              <p className="text-lg font-medium text-neutral-900">Mastermind</p>
              <p className="text-xs text-neutral-500">El cerebro estratégico de LandCopy</p>
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition hover:bg-neutral-100"
          >
            ← Volver
          </button>
        </div>

        {/* Caja para pegar landing */}
        <p className="mb-2.5 text-base font-medium text-neutral-900">📋 Pega tu landing para analizar</p>
        <div className="mb-4 rounded-xl border border-neutral-200 bg-white p-4">
          <textarea
            value={landing}
            onChange={(e) => setLanding(e.target.value)}
            rows={6}
            placeholder="Pega aquí el texto de tu landing (titular, beneficios, oferta, CTA...)"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-700 outline-none focus:border-neutral-400 resize-none"
          />
          <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 py-2.5 text-sm text-neutral-600 transition hover:bg-neutral-50">
            🖼 {imagen ? "Imagen cargada ✓ (toca para cambiar)" : "Subir imagen de la landing o anuncio"}
            <input type="file" accept="image/*" onChange={subirImagen} className="hidden" />
          </label>
          {imagen && (
            <div className="mt-2 relative">
              <img src={imagen} alt="preview" className="max-h-40 w-full rounded-lg object-contain bg-neutral-100" />
              <button
                onClick={() => setImagen(null)}
                className="absolute top-1 right-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white hover:bg-black/80"
              >
                ✕ Quitar
              </button>
            </div>
          )}
          <button
            onClick={analizar}
            disabled={analizando || (!landing.trim() && !imagen)}
            className="mt-3 w-full rounded-lg py-2.5 text-sm font-medium text-white transition disabled:opacity-40"
            style={{ background: "#D85A30" }}
          >
            {analizando ? "⟳ El Consejo está analizando..." : "⚡ Analizar con el Consejo"}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Resultado */}
        {resultado && (
          <>
            {/* Salud de campaña */}
            <p className="mb-2.5 text-base font-medium text-neutral-900">🫀 Salud de campaña</p>
            <div className="mb-6 rounded-xl border border-neutral-200 bg-white px-4 py-3.5">
              {resultado.salud?.map((r: any) => (
                <div key={r.label} className="mb-2.5 flex items-center gap-2.5 last:mb-0">
                  <span className="w-28 flex-shrink-0 text-[13px] text-neutral-700">{r.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded bg-neutral-100">
                    <div className="h-full rounded" style={{ width: `${r.val * 10}%`, background: colorSalud(r.val) }} />
                  </div>
                  <span className="w-10 flex-shrink-0 text-right text-[13px] text-neutral-500">{r.val}/10</span>
                </div>
              ))}
            </div>

            {/* Diagnóstico y acciones */}
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="mb-2.5 flex items-center gap-1.5 text-sm font-medium text-neutral-900">
                  <span className="h-2 w-2 rounded-full" style={{ background: "#378ADD" }} /> Diagnóstico · Nehemías
                </p>
                <p className="mb-1 text-xs" style={{ color: "#0F6E56" }}>✓ Fortalezas: {resultado.fortalezas}</p>
                <p className="mb-1 text-xs" style={{ color: "#854F0B" }}>⚠ Debilidades: {resultado.debilidades}</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="mb-2.5 flex items-center gap-1.5 text-sm font-medium text-neutral-900">
                  <span className="h-2 w-2 rounded-full" style={{ background: "#639922" }} /> Acciones · Caleb
                </p>
                {resultado.acciones?.map((a: string, i: number) => (
                  <p key={i} className="mb-1.5 rounded-md bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-700">{a}</p>
                ))}
              </div>
            </div>

            {/* Veredicto */}
            <div className="rounded-xl border p-4" style={{ borderColor: "#AFA9EC", background: "#F5F4FE" }}>
              <p className="mb-2 text-[15px] font-medium" style={{ color: "#26215C" }}>⚖ Veredicto del Consejo</p>
              <p className="text-[13px] leading-relaxed" style={{ color: "#26215C" }}>{resultado.diagnostico}</p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
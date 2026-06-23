"use client";

import { useRouter } from "next/navigation";

const SALUD = [
  { label: "Oferta", val: 7 },
  { label: "Headline", val: 8 },
  { label: "CTA", val: 5 },
  { label: "Urgencia", val: 4 },
  { label: "Confianza", val: 8 },
  { label: "Diferenciación", val: 6 },
  { label: "Listo para pautar", val: 7 },
  { label: "Coherencia anuncio-landing", val: 6 },
];

function colorSalud(v: number) {
  if (v >= 7) return "#639922";
  if (v >= 5) return "#EF9F27";
  return "#E24B4A";
}

const ACTIVOS_DEMO = [
  { tipo: "Anuncio", color: "#993C1D", bg: "#FAECE7" },
  { tipo: "Landing", color: "#3B6D11", bg: "#EAF3DE" },
  { tipo: "Redes", color: "#3C3489", bg: "#EEEDFE" },
  { tipo: "Anuncio", color: "#993C1D", bg: "#FAECE7" },
];

export default function MastermindPage() {
  const router = useRouter();

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
            ← Volver a Josué
          </button>
        </div>

        {/* Campaña activa */}
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100 text-neutral-400">📷</div>
          <div className="flex-1">
            <p className="text-[13px] font-medium text-neutral-900">Campaña activa: Crema Regeneradora Dunamix</p>
            <p className="text-xs text-neutral-500">Colombia · Tono urgente · $89.000 → $59.000</p>
          </div>
          <span className="rounded-md px-2.5 py-1 text-[11px]" style={{ background: "#E1F5EE", color: "#0F6E56" }}>
            Conectada
          </span>
        </div>

        {/* Salud de campaña */}
        <p className="mb-2.5 text-base font-medium text-neutral-900">🫀 Salud de campaña</p>
        <div className="mb-6 rounded-xl border border-neutral-200 bg-white px-4 py-3.5">
          {SALUD.map((r) => (
            <div key={r.label} className="mb-2.5 flex items-center gap-2.5 last:mb-0">
              <span className="w-[155px] text-xs text-neutral-500">{r.label}</span>
              <div className="h-[7px] flex-1 overflow-hidden rounded bg-neutral-100">
                <div className="h-full rounded" style={{ width: `${r.val * 10}%`, background: colorSalud(r.val) }} />
              </div>
              <span className="w-[34px] text-right text-xs font-medium text-neutral-800">{r.val}/10</span>
            </div>
          ))}
        </div>

        {/* Diagnóstico + Acciones */}
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
            <div className="mb-2.5 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#378ADD" }} />
              <span className="text-sm font-medium text-neutral-900">Diagnóstico · Nehemías</span>
            </div>
            <p className="mb-1 text-xs" style={{ color: "#0F6E56" }}>✓ Fortalezas: oferta clara, foto real</p>
            <p className="mb-1 text-xs" style={{ color: "#854F0B" }}>⚠ Debilidades: CTA aparece tarde</p>
            <p className="mb-1 text-xs" style={{ color: "#A32D2D" }}>⚑ Riesgos: poca urgencia visible</p>
            <p className="text-xs" style={{ color: "#185FA5" }}>💡 Oportunidad: subir testimonios</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
            <div className="mb-2.5 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#639922" }} />
              <span className="text-sm font-medium text-neutral-900">Acciones · Caleb</span>
            </div>
            {["Mejorar la oferta", "Crear seguimiento WhatsApp", "Subir temperatura a HOT"].map((a) => (
              <button
                key={a}
                className="mb-1.5 flex w-full items-center justify-between rounded-md border border-neutral-300 px-2.5 py-1.5 text-left text-xs text-neutral-700 transition last:mb-0 hover:bg-neutral-50"
              >
                {a} <span>↗</span>
              </button>
            ))}
          </div>
        </div>

        {/* Decisión final del Consejo */}
        <div className="mb-6 rounded-xl border p-4" style={{ background: "#EEEDFE", borderColor: "#AFA9EC" }}>
          <div className="mb-2.5 flex items-center gap-2">
            <span className="text-lg" style={{ color: "#3C3489" }}>⚖️</span>
            <p className="text-[15px] font-medium" style={{ color: "#26215C" }}>Decisión final del Consejo</p>
            <span className="ml-auto flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: "#639922" }} />
              <span className="h-2 w-2 rounded-full" style={{ background: "#378ADD" }} />
              <span className="text-[11px]" style={{ color: "#3C3489" }}>Caleb + Nehemías de acuerdo</span>
            </span>
          </div>
          <div className="mb-2.5 flex items-center gap-2.5">
            <span className="rounded-md px-2.5 py-1 text-[11px] font-medium" style={{ background: "#FAEEDA", color: "#854F0B" }}>
              ⏸ Aún no pautes
            </span>
            <span className="text-xs" style={{ color: "#26215C" }}>Veredicto conjunto</span>
          </div>
          <p className="mb-3 text-[13px] leading-relaxed" style={{ color: "#26215C" }}>
            La campaña tiene buena base (oferta y confianza fuertes), pero la <span className="font-medium">urgencia 4/10</span> y el{" "}
            <span className="font-medium">CTA tardío</span> te van a quemar presupuesto en frío. Arregla esos dos antes de invertir en pauta.
          </p>
          <div className="rounded-md bg-white px-3 py-2.5">
            <p className="mb-1 text-[11px] text-neutral-500">Siguiente paso acordado</p>
            <p className="text-[13px] text-neutral-800">
              1. Sube el CTA al primer pliegue · 2. Añade urgencia real (stock/tiempo) · 3. Vuelve a medir aquí
            </p>
          </div>
        </div>

        {/* Sube para analizar */}
        <p className="mb-2.5 text-base font-medium text-neutral-900">⬆️ Sube lo que ya tienes para analizar</p>
        <div className="mb-3 rounded-xl border-[1.5px] border-dashed border-neutral-300 bg-white px-4 py-5 text-center">
          <div className="text-3xl text-neutral-300">☁️</div>
          <p className="mb-0.5 mt-2 text-sm font-medium text-neutral-900">Arrastra tu landing, anuncio o el de tu competencia</p>
          <p className="mb-3.5 text-xs text-neutral-500">Nehemías lo analiza y Caleb te dice cómo superarlo</p>

          <p className="mb-2 text-[11px] text-neutral-400">Desde afuera</p>
          <div className="mb-3.5 flex flex-wrap justify-center gap-2">
            {["🔗 Pegar URL", "🖼 Imagen / captura", "📄 PDF"].map((b) => (
              <button key={b} className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 transition hover:bg-neutral-50">
                {b}
              </button>
            ))}
          </div>

          <div className="mb-3.5 h-px bg-neutral-200" />

          <p className="mb-2 text-[11px] text-neutral-400">Desde LandCopy — lo que ya tienes dentro</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button className="rounded-md border-[1.5px] px-3 py-1.5 text-xs font-medium transition hover:opacity-80" style={{ borderColor: "#D85A30", color: "#993C1D" }}>
              📚 Traer de mi Biblioteca
            </button>
            <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 transition hover:bg-neutral-50">📋 Mi landing</button>
            <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 transition hover:bg-neutral-50">📣 Mis anuncios</button>
          </div>
        </div>

        {/* Grid Biblioteca */}
        <div className="mb-6 rounded-xl border border-neutral-200 bg-white px-3.5 py-3">
          <p className="mb-2.5 text-xs text-neutral-500">
            <span style={{ color: "#993C1D" }}>📚</span> Tu Biblioteca — toca un activo para analizarlo
          </p>
          <div className="grid grid-cols-4 gap-2">
            {ACTIVOS_DEMO.map((a, i) => (
              <div key={i} className="relative flex aspect-square items-center justify-center rounded-md bg-neutral-100 text-neutral-400">
                🖼
                <span className="absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[9px]" style={{ background: a.bg, color: a.color }}>
                  {a.tipo}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Inteligencia competitiva */}
        <p className="mb-2.5 text-base font-medium text-neutral-900">⚔️ Inteligencia competitiva</p>
        <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-[11px] text-neutral-500">Índice de ventaja</p>
              <p className="text-3xl font-medium leading-tight" style={{ color: "#534AB7" }}>
                74<span className="text-sm text-neutral-400">/100</span>
              </p>
            </div>
            <div className="flex-1 text-xs leading-relaxed text-neutral-500">
              Tu campaña <span className="font-medium text-neutral-900">Dunamix</span> vs.{" "}
              <span className="font-medium text-neutral-900">Competidor X</span> — ganas en confianza, pierdes en urgencia.
            </div>
          </div>
        </div>

        {/* Mesa de conversación */}
        <div className="rounded-xl border border-neutral-300 bg-white p-3">
          <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-neutral-500">Le hablas a:</span>
            <button className="rounded-md border px-2.5 py-1 text-[11px]" style={{ borderColor: "#D85A30", color: "#993C1D" }}>
              <span className="mr-1.5 inline-block h-[7px] w-[7px] rounded-full align-middle" style={{ background: "#D85A30" }} />
              Josué
            </button>
            <button className="rounded-md border border-neutral-300 px-2.5 py-1 text-[11px] text-neutral-700">
              <span className="mr-1.5 inline-block h-[7px] w-[7px] rounded-full align-middle" style={{ background: "#639922" }} />
              Caleb
            </button>
            <button className="rounded-md border border-neutral-300 px-2.5 py-1 text-[11px] text-neutral-700">
              <span className="mr-1.5 inline-block h-[7px] w-[7px] rounded-full align-middle" style={{ background: "#378ADD" }} />
              Nehemías
            </button>
            <button className="ml-auto rounded-md border px-2.5 py-1 text-[11px]" style={{ borderColor: "#AFA9EC", color: "#3C3489" }}>
              👥 Todo el Consejo
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-md border border-neutral-300 px-2.5 py-2 text-neutral-600 transition hover:bg-neutral-50" aria-label="Adjuntar">📎</button>
            <input
              type="text"
              placeholder='Escribe tu inquietud… ej: "¿bajo el precio o agrego garantía?"'
              className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-[13px] text-neutral-700 outline-none focus:border-neutral-400"
            />
            <button className="rounded-md border px-3 py-2 transition hover:opacity-80" style={{ borderColor: "#993C1D", color: "#993C1D" }} aria-label="Enviar">
              ➤
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
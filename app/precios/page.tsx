export default function Precios() {
  const modulosInicial = ["Landing", "Copy"];
  const bloqueadosInicial = ["Anuncios · RED-EXPRESS", "Social Planner · Biblioteca", "Campañas"];
  const modulosPro = ["Landing · Copy", "Anuncios", "RED-EXPRESS", "Social Planner", "Biblioteca"];
  const modulosCompleto = ["Todo lo de Pro", "Campañas"];

  return (
    <div className="min-h-screen bg-[#050505]">
      <section className="max-w-6xl mx-auto px-5 pt-24 pb-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">Elige tu plan</h1>
          <p className="text-zinc-500 text-base">Empieza hoy. Cambia o cancela cuando quieras.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">

          {/* INICIAL */}
          <div className="bg-[#0d0d0d] border border-[#222] rounded-2xl p-6 flex flex-col">
            <h3 className="text-white font-semibold text-lg mb-1">Inicial</h3>
            <div className="mb-4"><span className="text-3xl font-bold text-yellow-400">$9</span><span className="text-zinc-500 text-sm">/mes</span></div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Módulos</p>
            {modulosInicial.map(m => <div key={m} className="flex items-start gap-2 text-[13px] text-zinc-200 mb-1.5"><span className="text-green-500">✓</span>{m}</div>)}
            {bloqueadosInicial.map(m => <div key={m} className="flex items-start gap-2 text-[13px] text-zinc-600 mb-1.5"><span>−</span>{m}</div>)}
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-2 mb-2">Consejo IA</p>
            <div className="flex items-start gap-2 text-[13px] text-yellow-400 mb-1.5"><span>🤖</span>Josué te acompaña</div>
            <div className="mt-auto pt-3 border-t border-[#222]">
              <p className="text-xs text-zinc-500">📷 Hasta 60 imágenes/mes</p>
            </div>
            <a href="/login" className="mt-4 block text-center border border-[#444] text-white font-medium py-3 rounded-xl hover:border-[#666] transition-colors">Elegir Inicial</a>
          </div>

          {/* PRO */}
          <div className="bg-[#0d0d0d] border-2 border-[#ff5000] rounded-2xl p-6 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ff5000] text-white text-[11px] font-medium px-3 py-1 rounded-lg whitespace-nowrap">Más popular</div>
            <h3 className="text-white font-semibold text-lg mb-1">Pro</h3>
            <div className="mb-4"><span className="text-3xl font-bold text-yellow-400">$16</span><span className="text-zinc-500 text-sm">/mes</span></div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Módulos</p>
            {modulosPro.map(m => <div key={m} className="flex items-start gap-2 text-[13px] text-zinc-200 mb-1.5"><span className="text-green-500">✓</span>{m}</div>)}
            <div className="flex items-start gap-2 text-[13px] text-zinc-600 mb-1.5"><span>−</span>Campañas</div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-2 mb-2">Consejo IA</p>
            <div className="flex items-start gap-2 text-[13px] text-yellow-400 mb-1.5"><span>🤖</span>Josué + Caleb (estrategia)</div>
            <div className="flex items-start gap-2 text-[13px] text-zinc-600 mb-1.5"><span>🔒</span>Nehemías · Mastermind</div>
            <div className="mt-auto pt-3 border-t border-[#222]">
              <p className="text-xs text-zinc-500">📷 Hasta 150 imágenes/mes</p>
            </div>
            <a href="/login" className="mt-4 block text-center bg-[#ff5000] text-white font-medium py-3 rounded-xl hover:bg-[#e64800] transition-colors">Elegir Pro</a>
          </div>

          {/* COMPLETO */}
          <div className="bg-[#0d0d0d] border border-[#222] rounded-2xl p-6 flex flex-col">
            <h3 className="text-white font-semibold text-lg mb-1">Completo</h3>
            <div className="mb-4"><span className="text-3xl font-bold text-yellow-400">$24</span><span className="text-zinc-500 text-sm">/mes</span></div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Módulos</p>
            {modulosCompleto.map(m => <div key={m} className="flex items-start gap-2 text-[13px] text-zinc-200 mb-1.5"><span className="text-green-500">✓</span>{m}</div>)}
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-2 mb-2">Consejo IA</p>
            <div className="flex items-start gap-2 text-[13px] text-yellow-400 mb-1.5"><span>🤖</span>Josué + Caleb + Nehemías</div>
            <div className="flex items-start gap-2 text-[13px] text-yellow-400 mb-1"><span>🔥</span>Mastermind habilitado</div>
            <p className="text-[11px] text-zinc-500 ml-6 leading-tight">Salud de campaña, métricas y diagnóstico</p>
            <div className="mt-auto pt-3 border-t border-[#222]">
              <p className="text-xs text-zinc-500">📷 Hasta 280 imágenes/mes</p>
            </div>
            <a href="/login" className="mt-4 block text-center border border-[#444] text-white font-medium py-3 rounded-xl hover:border-[#666] transition-colors">Elegir Completo</a>
          </div>

        </div>

        <p className="text-center text-zinc-600 text-xs mt-8">⚡ ¿Se te acaban las imágenes? Recarga créditos sin cambiar de plan.</p>
      </section>
    </div>
  );
}
"use client";

export default function SinCampana() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8 text-center mb-6">
        <div className="text-5xl mb-4">🚀</div>
        <h2 className="text-2xl font-black text-white mb-2">Empieza por tu campaña</h2>
        <p className="text-yellow-400 text-sm mb-7 leading-relaxed max-w-md mx-auto">
          En LandCopy todo nace de una campaña. Subes tu producto <span className="text-white font-bold">una sola vez</span> y tus datos —foto, precios, headline y beneficios— viajan solos a Copy, Anuncios y Landing.
        </p>
        <a href="/campaigns" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-black px-8 py-4 rounded-xl text-base transition-colors mb-7">➕ Crear o elegir mi campaña</a>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: "📸", txt: "La foto viaja automáticamente" },
            { icon: "⚡", txt: "Sin llenar datos de nuevo" },
            { icon: "💾", txt: "Todo queda guardado" },
          ].map((v, i) => (
            <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">{v.icon}</div>
              <p className="text-[10px] text-yellow-400">{v.txt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
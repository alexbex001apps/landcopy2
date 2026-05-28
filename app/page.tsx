export default function Home() {
  return (
    <div className="min-h-screen bg-black">

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-block bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium px-3 py-1 rounded-full mb-6">
          Generador de marketing con IA
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
          Crea contenido que<br />
          <span className="text-orange-500">vende de verdad</span>
        </h1>
        <p className="text-zinc-400 text-xl max-w-2xl mx-auto mb-10">
          Sube la foto de tu producto y genera imágenes profesionales, copy para WhatsApp, Meta Ads y landing en segundos.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a href="/login" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
            Empezar gratis
          </a>
          <a href="#modulos" className="text-zinc-400 hover:text-white px-8 py-4 rounded-xl text-lg transition-colors border border-zinc-800 hover:border-zinc-600">
            Ver módulos
          </a>
        </div>
      </section>

      {/* MÓDULOS */}
      <section id="modulos" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Todo lo que necesitas para vender</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/40 transition-colors">
            <div className="text-orange-500 text-3xl mb-4">✍️</div>
            <h3 className="text-white font-bold text-xl mb-2">Generador de Copy</h3>
            <p className="text-zinc-400 text-sm">Landing, WhatsApp, Meta Ads y más. Copy que convierte en segundos.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/40 transition-colors">
            <div className="text-orange-500 text-3xl mb-4">📸</div>
            <h3 className="text-white font-bold text-xl mb-2">Imágenes para Redes</h3>
            <p className="text-zinc-400 text-sm">Sube tu producto y genera imágenes profesionales para Instagram, TikTok y Facebook.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-orange-500/40 transition-colors">
            <div className="text-orange-500 text-3xl mb-4">🚀</div>
            <h3 className="text-white font-bold text-xl mb-2">Landing Page</h3>
            <p className="text-zinc-400 text-sm">Set completo de 8 imágenes para tu landing. Hero, beneficios, testimonios y más.</p>
          </div>
        </div>
      </section>

    </div>
  );
}
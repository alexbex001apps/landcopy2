export default function Precios() {
  return (
    <div className="min-h-screen bg-black">
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-block bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium px-3 py-1 rounded-full mb-6">
          Planes y precios
        </div>
        <h1 className="text-5xl font-bold text-white mb-4">
          Simple y <span className="text-orange-500">transparente</span>
        </h1>
        <p className="text-zinc-400 text-xl max-w-xl mx-auto mb-16">
          Sin sorpresas. Elige el plan que mejor se adapta a tu negocio.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-left">
            <h3 className="text-white font-bold text-xl mb-2">Básico</h3>
            <p className="text-zinc-400 text-sm mb-6">Para emprendedores que están comenzando.</p>
            <div className="text-4xl font-bold text-white mb-1">$9<span className="text-lg text-zinc-400 font-normal">/mes</span></div>
            <p className="text-zinc-500 text-sm mb-8">30 generaciones al mes</p>
            <ul className="space-y-3 text-sm text-zinc-300 mb-8">
              <li>✅ Generador de copy</li>
              <li>✅ Imágenes para redes</li>
              <li>✅ Landing Page</li>
              <li>❌ Banco de productos</li>
              <li>❌ Soporte prioritario</li>
            </ul>
            <a href="/login" className="block text-center bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-colors">Empezar</a>
          </div>
          <div className="bg-zinc-900 border-2 border-orange-500 rounded-2xl p-8 text-left relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full">MÁS POPULAR</div>
            <h3 className="text-white font-bold text-xl mb-2">Pro</h3>
            <p className="text-zinc-400 text-sm mb-6">Para negocios que quieren crecer rápido.</p>
            <div className="text-4xl font-bold text-white mb-1">$14<span className="text-lg text-zinc-400 font-normal">/mes</span></div>
            <p className="text-zinc-500 text-sm mb-8">Generaciones ilimitadas</p>
            <ul className="space-y-3 text-sm text-zinc-300 mb-8">
              <li>✅ Generador de copy</li>
              <li>✅ Imágenes para redes</li>
              <li>✅ Landing Page</li>
              <li>✅ Banco de productos</li>
              <li>❌ Soporte prioritario</li>
            </ul>
            <a href="/login" className="block text-center bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl transition-colors">Empezar</a>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-left">
            <h3 className="text-white font-bold text-xl mb-2">Equipo</h3>
            <p className="text-zinc-400 text-sm mb-6">Para agencias y equipos de marketing.</p>
            <div className="text-4xl font-bold text-white mb-1">$18<span className="text-lg text-zinc-400 font-normal">/mes</span></div>
            <p className="text-zinc-500 text-sm mb-8">3 usuarios incluidos</p>
            <ul className="space-y-3 text-sm text-zinc-300 mb-8">
              <li>✅ Generador de copy</li>
              <li>✅ Imágenes para redes</li>
              <li>✅ Landing Page</li>
              <li>✅ Banco de productos</li>
              <li>✅ Soporte prioritario</li>
            </ul>
            <a href="/login" className="block text-center bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-colors">Empezar</a>
          </div>
        </div>
      </section>
    </div>
  );
}
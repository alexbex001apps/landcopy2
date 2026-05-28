export default function Login() {return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-bold text-white">Land<span className="text-orange-500">Copy</span></a>
          <p className="text-zinc-400 mt-2">Entra a tu cuenta o crea una nueva</p>
        </div><div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <div className="flex gap-2 mb-8">
            <button className="flex-1 bg-orange-500 text-white font-medium py-2 rounded-lg text-sm">Entrar</button>
            <button className="flex-1 bg-zinc-800 text-zinc-400 font-medium py-2 rounded-lg text-sm hover:text-white transition-colors">Registrarse</button>
          </div><div className="space-y-4">
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">Correo electrónico</label>
              <input type="email" placeholder="tu@correo.com" className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">Contraseña</label>
              <input type="password" placeholder="••••••••" className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors" />
            </div>
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors">Entrar</button>
          </div>
          <p className="text-center text-zinc-500 text-sm mt-6">¿Olvidaste tu contraseña? <a href="#" className="text-orange-500 hover:underline">Recupérala aquí</a></p>
        </div>
      </div>
    </div>
  );
}
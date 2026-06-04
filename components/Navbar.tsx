"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const inicial = user?.email?.[0].toUpperCase();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-900 bg-black/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="font-bold text-xl text-white">Land<span className="text-orange-500">Copy</span></a>
        <div className="flex items-center gap-6 text-sm text-zinc-400">
          <a href="/copy" className="hover:text-white transition-colors">Copy</a>
          <a href="/redes" className="hover:text-white transition-colors">Redes</a>
          <a href="/landing" className="hover:text-white transition-colors">Landing</a>
          <a href="/anuncios" className="hover:text-white transition-colors text-orange-400">Anuncios</a>
          <a href="/precios" className="hover:text-white transition-colors">Precios</a>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm hover:bg-orange-600 transition-colors"
              >
                {inicial}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <p className="text-xs text-zinc-500">Conectado como</p>
                    <p className="text-sm text-white truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
                  >
                    Cerrar sesión
                  </button>
                  <button
                    onClick={async () => {
                      const supabase = createClient();
                      await supabase.auth.signOut({ scope: "global" });
                      window.location.href = "/login";
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-orange-400 hover:bg-zinc-800 transition-colors border-t border-zinc-800"
                  >
                    Cerrar todas las sesiones
                  </button>       
                </div>
              )}
            </div>
          ) : (
            <a href="/login" className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Entrar</a>
          )}
        </div>
      </div>
    </nav>
  );
}
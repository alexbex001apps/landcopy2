"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const LogoCopy = () => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
    <rect x="6" y="4" width="14" height="18" rx="2" fill="white" opacity="0.2" stroke="white" strokeWidth="1.5"/>
    <rect x="10" y="8" width="14" height="18" rx="2" fill="white" opacity="0.4" stroke="white" strokeWidth="1.5"/>
    <line x1="13" y1="13" x2="21" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="13" y1="16" x2="21" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="13" y1="19" x2="18" y2="19" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const LogoRedes = () => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
    <circle cx="16" cy="16" r="10" stroke="white" strokeWidth="1.5" opacity="0.3"/>
    <circle cx="16" cy="16" r="6" stroke="white" strokeWidth="1.5" opacity="0.6"/>
    <circle cx="16" cy="16" r="2.5" fill="white"/>
    <line x1="16" y1="6" x2="16" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="16" y1="22" x2="16" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="6" y1="16" x2="10" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="22" y1="16" x2="26" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const LogoLanding = () => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
    <rect x="4" y="6" width="24" height="18" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.1"/>
    <rect x="4" y="6" width="24" height="5" rx="2" fill="white" fillOpacity="0.4"/>
    <circle cx="8" cy="8.5" r="1" fill="white"/>
    <circle cx="11" cy="8.5" r="1" fill="white"/>
    <circle cx="14" cy="8.5" r="1" fill="white"/>
    <rect x="8" y="14" width="8" height="5" rx="1" fill="white" fillOpacity="0.5"/>
    <line x1="18" y1="14" x2="24" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="18" y1="17" x2="24" y2="17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="18" y1="20" x2="22" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const LogoAnuncios = () => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
    <path d="M6 14 L20 8 L20 24 L6 18 Z" fill="white" fillOpacity="0.4" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
    <rect x="6" y="14" width="4" height="4" fill="white" fillOpacity="0.6"/>
    <rect x="6" y="18" width="4" height="4" rx="0 0 2 2" fill="white" fillOpacity="0.3"/>
    <circle cx="24" cy="12" r="2" fill="white"/>
    <circle cx="24" cy="20" r="2" fill="white"/>
    <line x1="22" y1="16" x2="26" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);



export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const LogoCampanas = () => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
    <rect x="4" y="8" width="24" height="16" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.1"/>
    <line x1="4" y1="13" x2="28" y2="13" stroke="white" strokeWidth="1" opacity="0.3"/>
    <rect x="7" y="16" width="6" height="4" rx="1" fill="white" fillOpacity="0.5"/>
    <line x1="16" y1="16" x2="25" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="16" y1="19" x2="22" y2="19" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="24" cy="9" r="3" fill="#22c55e"/>
    <line x1="24" y1="7.5" x2="24" y2="10.5" stroke="white" strokeWidth="1" strokeLinecap="round"/>
    <line x1="22.5" y1="9" x2="25.5" y2="9" stroke="white" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);
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

  const modulos = [
    { href: "/campaigns", label: "Campañas", Icon: LogoCampanas },
    { href: "/copy", label: "Copy", Icon: LogoCopy },
    { href: "/redes", label: "Redes", Icon: LogoRedes },
    { href: "/landing", label: "Landing", Icon: LogoLanding },
    { href: "/anuncios", label: "Anuncios", Icon: LogoAnuncios },
    { href: "/biblioteca", label: "Biblioteca", Icon: LogoCopy },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-900 bg-black/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="font-bold text-xl text-white">Land<span className="text-orange-500">Copy</span></a>
        <div className="flex items-center gap-1 text-sm text-zinc-400">
          {modulos.map(m => (
            <a key={m.href} href={m.href} className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-zinc-900 transition-colors group">
              <div className="w-11 h-11 rounded-full bg-[#0d0d0d] border border-[#1a1a1a] group-hover:border-orange-500 flex items-center justify-center transition-colors">
                <m.Icon />
              </div>
              <span className="text-[9px] font-bold text-white group-hover:text-orange-500 transition-colors">{m.label}</span>
            </a>
          ))}
          <a href="/precios" className="px-3 py-2 text-xs text-zinc-400 hover:text-white transition-colors ml-1">Precios</a>
          {user ? (
            <div className="relative ml-2">
              <button onClick={() => setMenuOpen(!menuOpen)} className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm hover:bg-orange-600 transition-colors">
                {inicial}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <p className="text-xs text-zinc-500">Conectado como</p>
                    <p className="text-sm text-white truncate">{user.email}</p>
                  </div>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-zinc-800 transition-colors">
                    Cerrar sesión
                  </button>
                  <button onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut({ scope: "global" });
                    window.location.href = "/login";
                  }} className="w-full text-left px-4 py-3 text-sm text-orange-400 hover:bg-zinc-800 transition-colors border-t border-zinc-800">
                    Cerrar todas las sesiones
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a href="/login" className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors ml-2">Entrar</a>
          )}
        </div>
      </div>
    </nav>
  );
}
"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Rutas publicas (landings de clientes) — el splash de LandCopy NUNCA debe salir ahi
const RUTAS_SIN_SPLASH = ["/v/", "/share/", "/venezuela", "/ayuda-venezuela"];

const SPLASH_KEY = "landcopy_splash_visto";

// Llamar al cerrar sesion: hace que el splash vuelva a salir antes del login
export function resetSplash() {
  try { sessionStorage.removeItem(SPLASH_KEY); } catch {}
}

export default function Splash() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  const rutaPublica = RUTAS_SIN_SPLASH.some((r) => pathname?.startsWith(r));

  useEffect(() => {
    if (rutaPublica) return;
    // Solo una vez por sesion: navegar entre modulos no lo repite
    if (sessionStorage.getItem(SPLASH_KEY)) return;
    setVisible(true);
    const timerSalida = setTimeout(() => setSaliendo(true), 4000);
    const timerFin = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem(SPLASH_KEY, "1");
    }, 4400);
    return () => {
      clearTimeout(timerSalida);
      clearTimeout(timerFin);
    };
  }, [rutaPublica]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes splash-logo-in {
          0% { opacity: 0; transform: scale(0.85) }
          100% { opacity: 1; transform: scale(1) }
        }
        @keyframes splash-glow {
          0%, 100% {
            filter: drop-shadow(0 0 12px rgba(255, 80, 0, 0.35)) drop-shadow(0 0 24px rgba(255, 176, 0, 0.2));
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(255, 80, 0, 0.55)) drop-shadow(0 0 40px rgba(255, 176, 0, 0.35));
          }
        }
        .splash-logo {
          animation: splash-logo-in 0.6s ease-out forwards, splash-glow 2.5s ease-in-out infinite 0.6s;
        }
        @media (prefers-reduced-motion: reduce) {
          .splash-logo { animation: none !important; opacity: 1 !important }
        }
      `}</style>

      <div
        onClick={() => setVisible(false)}
        className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black cursor-pointer transition-opacity duration-400 ${
          saliendo ? "opacity-0" : "opacity-100"
        }`}
      >
        <img
          src="/logo.png"
          alt="LandCopy"
          className="splash-logo w-64 sm:w-80 h-auto"
        />
      </div>
    </>
  );
}

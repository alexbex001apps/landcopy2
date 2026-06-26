"use client";

import { useEffect, useState } from "react";

// ============================================================
//  EDITA SOLO ESTAS LINEAS CADA 2 HORAS CON CIFRAS VERIFICADAS
//  Formato de fecha: "AAAA-MM-DDTHH:MM:SS-05:00" (hora Colombia)
// ============================================================
const ULTIMA_ACTUALIZACION = "2026-06-25T16:00:00-05:00";
const FALLECIDOS = "188+";
const HERIDOS = "1.520";
const DESAPARECIDOS = "157";
// ============================================================

function haceCuanto(ms: number): string {
  const min = Math.floor(ms / 60000);
  if (min < 1) return "hace instantes";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `hace ${h} h ${m} min` : `hace ${h} h`;
}

function BanderaVenezuela() {
  const estrellas = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <div className="w-full overflow-hidden">
      <div className="h-6 bg-[#ffcc00]"></div>
      <div className="relative h-6 bg-[#00247d]">
        <div className="absolute inset-0 flex items-center justify-center gap-[6px]">
          {estrellas.map((i) => {
            const offset = Math.sin((i / 7) * Math.PI) * 6;
            return (
              <span
                key={i}
                className="text-white"
                style={{
                  fontSize: "11px",
                  lineHeight: "1",
                  transform: `translateY(${6 - offset}px)`,
                }}
              >
                {"\u2605"}
              </span>
            );
          })}
        </div>
      </div>
      <div className="h-6 bg-[#cf142b]"></div>
    </div>
  );
}

export default function AyudaVenezuela() {
  const [mounted, setMounted] = useState(false);
  const [ahora, setAhora] = useState<number>(() => Date.now());
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const actualizado = new Date(ULTIMA_ACTUALIZACION).getTime();
  const etiquetaTiempo = mounted
    ? `actualizado ${haceCuanto(ahora - actualizado)}`
    : "en vivo";
  const reloj = mounted
    ? new Date(ahora).toLocaleTimeString("es-CO", { hour12: false })
    : "--:--:--";

  return (
    <main className="bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-md bg-white">
        <BanderaVenezuela />

        <header className="border-b border-neutral-200 px-5 pb-4 pt-5">
          <p className="text-[11px] font-medium tracking-wide text-neutral-500">
            IGLESIA BETHEL - DUNAMIXFY
          </p>
          <h1 className="mt-1.5 text-2xl font-medium">Venezuela necesita ayuda</h1>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600">
            Canales verificados para donar, buscar a los tuyos y llevar ayuda.
            Sin rumores.
          </p>
          <div className="mt-3 flex gap-2">
            <a
              href="https://wa.me/?text=Ante%20la%20tragedia%20en%20Venezuela%2C%20esta%20pagina%20reune%20canales%20verificados%20para%20donar%2C%20buscar%20familiares%20y%20llevar%20ayuda.%20Sin%20rumores.%20Compartela%20con%20quien%20la%20necesite.%20https%3A//landcopy2.vercel.app/ayuda-venezuela"
              className="flex-1 rounded-lg bg-green-50 py-2.5 text-center text-sm font-medium text-green-700"
            >
              Compartir
            </a>
            <a
              href="#donar"
              className="flex-1 rounded-lg bg-blue-50 py-2.5 text-center text-sm font-medium text-blue-700"
            >
              Donar
            </a>
          </div>
          <p className="mt-3 text-center text-xs font-medium text-neutral-700">
            Comparte esta info, puede ser de muchisima ayuda
          </p>
          <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
            <span className="flex-1 truncate text-xs text-neutral-600">
              landcopy2.vercel.app/ayuda-venezuela
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  "https://landcopy2.vercel.app/ayuda-venezuela"
                );
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2000);
              }}
              className="shrink-0 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>
        </header>

        <div className="space-y-6 px-5 py-5">
          <section className="rounded-lg bg-neutral-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600"></span>
                </span>
                <span className="text-[11px] font-medium tracking-wide text-green-700">
                  EN VIVO
                </span>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-neutral-500">
                {reloj}
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-sm font-medium">Cifras oficiales</p>
              <span className="text-[11px] text-neutral-400">{etiquetaTiempo}</span>
            </div>

            <div className="mt-3 flex gap-3">
              <div className="flex-1">
                <p className="text-xl font-medium tabular-nums">{FALLECIDOS}</p>
                <p className="text-[11px] text-neutral-600">fallecidos</p>
              </div>
              <div className="flex-1">
                <p className="text-xl font-medium tabular-nums">{HERIDOS}</p>
                <p className="text-[11px] text-neutral-600">heridos</p>
              </div>
              <div className="flex-1">
                <p className="text-xl font-medium tabular-nums">{DESAPARECIDOS}</p>
                <p className="text-[11px] text-neutral-600">desaparecidos</p>
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-neutral-500">
              Cifra oficial del gobierno. No incluye aun La Guaira, por lo
              que subira. Confirma siempre en fuentes oficiales.
            </p>
          </section>

          <section id="donar">
            <p className="mb-2.5 text-xs font-medium tracking-wide text-neutral-500">
              COMO DONAR
            </p>
            <div className="space-y-2">
              <a
                href="https://www.globalgiving.org/projects/venezuela-earthquake-relief-fund/"
                className="block rounded-lg border border-neutral-200 p-3.5"
              >
                <span className="text-sm font-medium">GlobalGiving</span>
                <span className="block text-xs text-neutral-600">
                  Fondo a organizaciones locales
                </span>
              </a>
              <a
                href="https://www.savethechildren.es/donacion-ong/terremoto-en-venezuela-2026"
                className="block rounded-lg border border-neutral-200 p-3.5"
              >
                <span className="text-sm font-medium">Save the Children</span>
                <span className="block text-xs text-neutral-600">
                  Ninez y refugio
                </span>
              </a>
              <a
                href="https://www.globalempowermentmission.org/mission/venezuela-earthquake/"
                className="block rounded-lg border border-neutral-200 p-3.5"
              >
                <span className="text-sm font-medium">
                  Global Empowerment Mission
                </span>
                <span className="block text-xs text-neutral-600">
                  Ya desplegada en terreno
                </span>
              </a>
            </div>
          </section>

          <section>
            <p className="mb-2.5 text-xs font-medium tracking-wide text-neutral-500">
              BUSCAR A LOS TUYOS
            </p>
            <div className="space-y-2">
              <a
                href="https://wa.me/573212139525"
                className="block rounded-lg bg-neutral-100 p-3.5"
              >
                <span className="text-sm font-medium">Cruz Roja Colombiana</span>
                <span className="mt-0.5 block text-xs text-blue-600">
                  WhatsApp +57 321 213 9525
                </span>
              </a>
              <a
                href="https://venezuelatebusca.com"
                className="block rounded-lg bg-neutral-100 p-3.5"
              >
                <p className="text-sm font-medium">Reportar o buscar desaparecidos</p>
                <span className="mt-0.5 block text-xs text-blue-600">
                  Plataforma Venezuela Te Busca
                </span>
                <span className="mt-0.5 block text-[11px] text-neutral-500">
                  Iniciativa ciudadana, no oficial. Verifica los datos.
                </span>
              </a>
              <div className="rounded-lg bg-neutral-100 p-3.5">
                <p className="text-sm font-medium">Heridos hospitalizados</p>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">
                  Hay 20 hospitales habilitados en el area de Caracas. Para
                  localizar a un herido, usa los canales de busqueda de arriba.
                </p>
              </div>
            </div>
          </section>

          <section>
            <p className="mb-2.5 text-xs font-medium tracking-wide text-neutral-500">
              COMO VA LA AYUDA INTERNACIONAL
            </p>
            <div className="space-y-2">
              <div className="rounded-lg border border-neutral-200 p-3.5">
                <p className="text-sm font-medium">Naciones Unidas</p>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">
                  Coordina equipos de busqueda y rescate de todo el mundo.
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 p-3.5">
                <p className="text-sm font-medium">Estados Unidos</p>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">
                  Anuncio 150 millones de dolares y equipos de rescate.
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 p-3.5">
                <p className="text-sm font-medium">Espana, Mexico y mas</p>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">
                  Hospital de campana, rescatistas y ayuda desde varios paises.
                </p>
              </div>
              <a
                href="https://wck.org"
                className="block rounded-lg border border-neutral-200 p-3.5"
              >
                <p className="text-sm font-medium">World Central Kitchen</p>
                <span className="mt-0.5 block text-xs leading-relaxed text-neutral-600">
                  Ya reparte comidas en las zonas afectadas. Toca para donar.
                </span>
              </a>
            </div>
          </section>

          <section>
            <p className="mb-2.5 text-xs font-medium tracking-wide text-neutral-500">
              ACOPIO EN MEDELLIN
            </p>
            <div className="space-y-2">
              <div className="rounded-lg border border-neutral-200 p-3.5">
                <p className="text-sm font-medium">Restaurante Tepuy</p>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">
                  Laureles: Cra. 73C #3-5. Envigado: Transv. 32A Sur #31E-20.
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  Solo insumos medicos y de primeros auxilios
                </p>
                <div className="mt-2 flex gap-2">
                  <a href="https://www.google.com/maps/search/?api=1&query=Restaurante+Tepuy+Laureles+Medellin" className="text-xs font-medium text-blue-600">Ver Laureles</a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Restaurante+Tepuy+Envigado" className="text-xs font-medium text-blue-600">Ver Envigado</a>
                </div>
              </div>
              <div className="rounded-lg border border-neutral-200 p-3.5">
                <p className="text-sm font-medium">Grupo Mega</p>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">
                  Itagui: Mall Itagui, local 146. Bello: Cra. 50 #50-15.
                </p>
                <p className="mt-1 text-xs text-neutral-600">
                  Comida, agua, ropa, higiene, paniales
                </p>
                <div className="mt-2 flex gap-2">
                  <a href="https://www.google.com/maps/search/?api=1&query=Mall+Itagui+Itagui" className="text-xs font-medium text-blue-600">Ver Itagui</a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Grupo+Mega+Bello+Carrera+50" className="text-xs font-medium text-blue-600">Ver Bello</a>
                </div>
              </div>
              <p className="px-1 text-[11px] leading-relaxed text-neutral-400">
                Medellin aun no tiene acopio oficial por logistica de envio.
                Estos son puntos privados verificados.
              </p>
            </div>
          </section>
        </div>

        <footer className="border-t border-neutral-200 px-5 py-6 text-center">
          <p className="text-sm italic leading-relaxed text-neutral-600">
            Lleven los unos las cargas de los otros.
          </p>
          <p className="mt-1 text-[11px] text-neutral-400">
            Galatas 6:2 - Iglesia Bethel
          </p>
          <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">
            Esta pagina es una iniciativa informativa de Iglesia Bethel. No
            recaudamos fondos; cada donacion va directo a la organizacion que
            elijas.
          </p>
        </footer>
      </div>
    </main>
  );
}




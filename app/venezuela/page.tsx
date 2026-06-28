"use client";

import { useEffect, useState } from "react";

// ============================================================
//  EDITA SOLO ESTAS LINEAS CADA 2 HORAS CON CIFRAS VERIFICADAS
//  Formato de fecha: "AAAA-MM-DDTHH:MM:SS-05:00" (hora Colombia)
// ============================================================
const ULTIMA_ACTUALIZACION = "2026-06-27T00:00:00-05:00";
const FALLECIDOS = "1.430";
const HERIDOS = "+3.200";
const DESAPARECIDOS = "+50.000";
// ============================================================

function haceCuanto(ms: number): string {
  const min = Math.floor(ms / 60000);
  if (min < 1) return "hace instantes";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `hace ${h} h ${m} min` : `hace ${h} h`;
}

function Cinta({ texto, color }: { texto: string; color: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${color}`}>
      {texto}
    </span>
  );
}

function TituloSeccion({ texto, color, barra }: { texto: string; color: string; barra: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className={`h-4 w-1 rounded-full ${barra}`}></span>
      <p className={`text-xs font-semibold tracking-wide ${color}`}>{texto}</p>
    </div>
  );
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
  const [peticion, setPeticion] = useState("");

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
              href="https://wa.me/?text=Ante%20la%20tragedia%20en%20Venezuela%2C%20esta%20pagina%20reune%20canales%20verificados%20para%20donar%2C%20buscar%20familiares%20y%20llevar%20ayuda.%20Sin%20rumores.%20Compartela%20con%20quien%20la%20necesite.%20https%3A//landcopy2.vercel.app/venezuela"
              className="flex-1 rounded-lg bg-green-600 py-2.5 text-center text-sm font-semibold text-white"
            >
              Compartir
            </a>
            <a
              href="#donar"
              className="flex-1 rounded-lg bg-blue-600 py-2.5 text-center text-sm font-semibold text-white"
            >
              Donar
            </a>
          </div>
          <p className="mt-3 text-center text-xs font-medium text-neutral-700">
            Comparte esta info, puede ser de muchisima ayuda
          </p>
          <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
            <span className="flex-1 truncate text-xs text-neutral-600">
              landcopy2.vercel.app/venezuela
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  "https://landcopy2.vercel.app/venezuela"
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
          <section className="rounded-xl border border-red-100 bg-red-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600"></span>
                </span>
                <span className="text-[11px] font-semibold tracking-wide text-red-700">
                  EN VIVO
                </span>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-neutral-500">
                {reloj}
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-sm font-medium">Magnitud de la tragedia</p>
              <span className="text-[11px] text-neutral-400">{etiquetaTiempo}</span>
            </div>

            <div className="mt-3 flex gap-3">
              <div className="flex-1">
                <p className="text-xl font-semibold tabular-nums text-red-800">{FALLECIDOS}</p>
                <p className="text-[11px] text-neutral-600">fallecidos (oficial)</p>
              </div>
              <div className="flex-1">
                <p className="text-xl font-semibold tabular-nums text-red-800">{HERIDOS}</p>
                <p className="text-[11px] text-neutral-600">heridos</p>
              </div>
              <div className="flex-1">
                <p className="text-xl font-semibold tabular-nums text-red-800">{DESAPARECIDOS}</p>
                <p className="text-[11px] text-neutral-600">desaparecidos</p>
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-neutral-500">
              El gobierno de Venezuela reconoce oficialmente 1.430 fallecidos y mas de 3.200 heridos al 27 de junio, una cifra que sigue subiendo conforme avanzan los rescates. El USGS (Servicio Geologico de Estados Unidos) emitio alerta roja, su nivel maximo, advirtiendo que el saldo real podria ser mucho mayor: su modelo automatico PAGER proyecta una alta probabilidad de que los fallecidos terminen entre 10.000 y 100.000, aunque es una estimacion, no un conteo confirmado. Desaparecidos: no hay cifra oficial, pero organizaciones de la ONU estiman mas de 50.000.
              Las cifras siguen subiendo. Confirma en fuentes oficiales.
            </p>
          </section>

          <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="mb-1.5"><Cinta texto="GRUPO DE INTERCESION" color="bg-amber-200 text-amber-800" /></div><p className="text-sm font-semibold text-amber-900">{"\u00bf"}Quieres que oremos por ti?</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">En medio de esta crisis no est{"\u00e1"}s solo. Tenemos un grupo de intercesi{"\u00f3"}n que orar{"\u00e1"} por ti, por tu familia o por quien lo necesite. Escribe tu petici{"\u00f3"}n. Puedes poner tu nombre o dejarla an{"\u00f3"}nima.</p>
            <textarea value={peticion} onChange={(e) => setPeticion(e.target.value)} placeholder="Escribe aqui tu peticion de oracion..." rows={3} className="mt-3 w-full resize-none rounded-lg border border-amber-300 bg-white p-2.5 text-sm text-neutral-800 outline-none focus:border-amber-500" />
            <a href={peticion.trim() ? `https://wa.me/573022235321?text=${encodeURIComponent("Hola, quiero que el grupo de intercesion ore por esto:\n\n" + peticion)}` : undefined} onClick={(e) => { if (!peticion.trim()) e.preventDefault(); }} className={`mt-2 block rounded-lg py-2.5 text-center text-sm font-medium ${peticion.trim() ? "bg-amber-600 text-white" : "cursor-not-allowed bg-amber-200 text-amber-500"}`}>Enviar mi peticion de oracion</a>
            <p className="mt-2 text-center text-[11px] text-amber-700">Tu peticion llega directo por WhatsApp. No se guarda en ningun sistema.</p>
          </section>
          <section id="donar">
            <TituloSeccion texto="COMO DONAR" color="text-green-700" barra="bg-green-500" />
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
            <TituloSeccion texto="BUSCAR A LOS TUYOS" color="text-blue-700" barra="bg-blue-500" />
            <div className="space-y-2">
              
              <a
                href="https://venezuelatebusca.com"
                className="block rounded-lg bg-neutral-100 p-3.5"
              >
                <div className="mb-1"><Cinta texto="URGENTE" color="bg-blue-600 text-white" /></div>
                <p className="text-sm font-medium">Reportar o buscar desaparecidos</p>
                <span className="mt-0.5 block text-xs text-blue-600">
                  Plataforma Venezuela Te Busca
                </span>
                <span className="mt-0.5 block text-[11px] text-neutral-500">
                  Iniciativa ciudadana, no oficial. Verifica los datos.
                </span>
              </a>

            </div>
          </section>

          <section className="mt-4">
            <TituloSeccion texto="PLATAFORMAS PARA BUSCAR Y AYUDAR" color="text-blue-700" barra="bg-blue-500" />
            <p className="mb-2.5 text-[11px] text-neutral-500">Iniciativas ciudadanas, no oficiales. Verifica siempre los datos.</p>
            <div className="space-y-2">
              <a href="https://venezuelareporta.org" className="block rounded-lg border border-neutral-200 p-3.5">
                <div className="mb-1"><Cinta texto="MAS COMPLETO" color="bg-blue-600 text-white" /></div><p className="text-sm font-medium">Venezuela Reporta</p>
                <span className="mt-0.5 block text-xs leading-relaxed text-neutral-600">El registro mas completo: busca por nombre o cedula, con fotos. Incluye mapa.</span>
                <span className="mt-1 block text-xs font-medium text-blue-600">Entrar</span>
              </a>
              <a href="https://pacientesterremotovzla.lovable.app" className="block rounded-lg border border-neutral-200 p-3.5">
                <p className="text-sm font-medium">Pacientes en hospitales</p>
                <span className="mt-0.5 block text-xs leading-relaxed text-neutral-600">Localiza personas atendidas en hospitales. Informacion verificada. Respeta la privacidad: usala solo para buscar a tu familiar.</span>
                <span className="mt-1 block text-xs font-medium text-blue-600">Entrar</span>
              </a>
              <a href="https://refugiosvenezuela.com" className="block rounded-lg border border-neutral-200 p-3.5">
                <p className="text-sm font-medium">Refugios y comida</p>
                <span className="mt-0.5 block text-xs leading-relaxed text-neutral-600">Mapa de refugios con cupo y centros de comida cercanos.</span>
                <span className="mt-1 block text-xs font-medium text-blue-600">Entrar</span>
              </a>
              <a href="https://ayudaparavenezuela.com" className="block rounded-lg border border-neutral-200 p-3.5">
                <p className="text-sm font-medium">Centros de acopio</p>
                <span className="mt-0.5 block text-xs leading-relaxed text-neutral-600">Donde llevar insumos y que se necesita por zona.</span>
                <span className="mt-1 block text-xs font-medium text-blue-600">Entrar</span>
              </a>
            </div>
          </section>
          <section>
            <TituloSeccion texto="COMO VA LA AYUDA INTERNACIONAL" color="text-neutral-600" barra="bg-neutral-400" />
            <div className="space-y-2">
              <div className="rounded-lg border border-neutral-200 p-3.5">
                <p className="text-sm font-medium">Naciones Unidas</p>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">
                  Mas de 1.000 rescatistas de 17 paises desplegados. Libero 15 millones de dolares de emergencia.
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 p-3.5">
                <p className="text-sm font-medium">Estados Unidos</p>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">
                  150 millones de dolares y equipos de rescate de Virginia y Los Angeles.
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 p-3.5">
                <p className="text-sm font-medium">El Salvador</p>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">
                  300 rescatistas, personal medico y 50 toneladas de suministros.
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 p-3.5">
                <p className="text-sm font-medium">Cruz Roja Internacional</p>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">
                  17 toneladas de ayuda desde Panama. Busca asistir a 300.000 personas.
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 p-3.5">
                <p className="text-sm font-medium">Espana, Mexico, Chile y mas</p>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">
                  Rescatistas y ayuda tambien desde Colombia, Ecuador, Peru, Italia, Suiza, Alemania, Francia, Qatar y mas.
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
            <TituloSeccion texto="ACOPIO EN MEDELLIN" color="text-orange-700" barra="bg-orange-500" />
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









































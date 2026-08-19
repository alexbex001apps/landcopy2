# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Comandos

```bash
npm install            # imprescindible en maquina nueva (node_modules no viaja por git)
npm run dev            # Next 16 dev server -> http://localhost:3000
npm run build          # SIEMPRE antes de commit: es la unica verificacion que existe
npm run lint           # eslint (flat config, eslint-config-next)
npm start              # servir el build de produccion
```

No hay tests ni framework de test. `npm run build` es el gate de calidad del proyecto.

### `.env.local` (no esta en git — hay que recrearlo)

Requeridas hoy: `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FAL_API_KEY`, `BIBLIOTECA_ESTILO_ADMINS` (lista de emails separada por comas).

Opcionales / billing todavia inactivo: `LEMON_SQUEEZY_API_KEY`, `LEMON_SQUEEZY_STORE_ID`, `LEMON_SQUEEZY_WEBHOOK_SECRET`, `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, `META_TRACKING_ENABLED`, `META_TEST_EVENT_CODE`. Sin ellas el modulo de precios degrada solo ("muy pronto") en vez de romper — mantener ese comportamiento al tocar `lib/payments/` o `app/precios/`.

## Arquitectura

LandCopy 2.0: plataforma SaaS (en espanol, para vendedores de LatAm) que genera copy, imagenes, videos, anuncios, planes de redes y landings publicables con IA. Next.js 16 App Router + TypeScript + Tailwind v4 + Supabase, desplegada en Vercel (`landcopy.app`).

### Supabase compartido con Social Red

El mismo proyecto Supabase sirve a esta app y a la app hermana `socialred.app`. Consecuencias que hay que respetar:

- `auth.users` es compartido: una cuenta sirve en ambas apps.
- Los **creditos son compartidos** ([lib/credits.ts](lib/credits.ts)): no reimplementar logica de saldo, solo llamar a las funciones Postgres `spend_credit` / `grant_credit` que son la unica fuente de verdad. 1 credito = 1 imagen; el texto no gasta.
- `users.plan` en cambio es **exclusivo de LandCopy** (gating de acceso); Social Red usa `subscriptions`/`plans`.
- Antes de "crear" una tabla o funcion, asumir que probablemente ya existe del lado de Social Red.

Tres clientes Supabase, no intercambiables:
- [lib/supabase/client.ts](lib/supabase/client.ts) — navegador (anon, RLS activa). [lib/supabase.ts](lib/supabase.ts) es una instancia singleton legacy del mismo cliente; el codigo nuevo usa `createClient()`.
- [lib/supabase/server.ts](lib/supabase/server.ts) — API routes con la sesion del usuario via cookies. Es la via correcta para endpoints autenticados (`supabase.auth.getUser()` -> 401 si no hay user), y deja que RLS filtre por usuario.
- [lib/supabase/service.ts](lib/supabase/service.ts) — service role, **solo backend**, salta RLS. Usar unicamente para creditos, banco global de estilo y landings publicas.

Tablas: `users`, `campaigns`, `productos`, `biblioteca`, `biblioteca_campanas`, `biblioteca_estilo`, `copys_guardados`, `redes_guardadas`, `landings_publicadas`, `avatares`, `carpetas`, `credit_balance`, `plans`, `topup_packs`, `subscriptions`, `orders`, `webhook_events`, `meta_events_log`, `meta_click_context`. Buckets: `campaign-images`, `biblioteca-images`, `biblioteca-estilo`, `avatares`, `leonel-assets` (poses del mascota, publico).

### Tres capas de acceso (las tres tienen que estar de acuerdo)

1. [proxy.ts](proxy.ts) (antes `middleware.ts`, renombrado en Next 16) — redirige a `/login` en `/copy`, `/redes`, `/landing` sin sesion; deja pasar `/venezuela` y `/ayuda-venezuela`.
2. [components/Guardian.tsx](components/Guardian.tsx) — envuelve TODO en [app/layout.tsx](app/layout.tsx). Lista blanca `LIBRES` + `/v/`; en el resto exige sesion y `users.plan` distinto de `sin_acceso`, si no manda a `/espera`. **Una ruta publica nueva hay que agregarla aqui tambien**, o quedara bloqueada aunque el proxy la deje pasar.
3. Gating de admin: `users.es_admin` para `/admin`; `BIBLIOTECA_ESTILO_ADMINS` (env var, sin tabla de roles) para la Biblioteca de Estilo ([lib/bibliotecaEstilo/admin.ts](lib/bibliotecaEstilo/admin.ts)).

El registro deja `plan: "sin_acceso"` a proposito — el usuario espera activacion manual en `/admin`.

### sessionStorage es el bus de datos entre modulos

Los modulos (`/campaigns`, `/copy`, `/landing`, `/anuncios`, `/redes*`, `/biblioteca`) no comparten estado por base de datos ni por contexto de React: se pasan el trabajo por `sessionStorage` con claves acordadas. La central es **`campaign_activa`** (JSON de la campana que se activa en [app/campaigns/page.tsx](app/campaigns/page.tsx)); cada modulo la lee al montar y adapta su UI a "con campana" o "sin campana" (ver [components/SinCampana.tsx](components/SinCampana.tsx)). Otras familias de claves: `landing_*` (contenido, imagenes, videos, color, fuente, pixel, whatsapp), `anuncios_*`, `redes_*`, `lc_*` (prellenado del formulario de copy), `landcopy_resultado`, `biblioteca_*`.

Por eso [lib/sesion.ts](lib/sesion.ts) es critico: `limpiarSesionLocal()` en cada cierre de sesion y `sincronizarUsuario(uid)` cuando entra un uid distinto — sin eso, el siguiente usuario del mismo navegador hereda el trabajo del anterior (bug real que ya paso). Al agregar una clave de sessionStorage nueva no hace falta tocar nada (se hace `sessionStorage.clear()`), pero una clave nueva en `localStorage` si hay que sumarla a `limpiarSesionLocal()`.

### API routes: patron uniforme

Todos los endpoints de IA viven en `app/api/**/route.ts` y comparten forma:

- `export const maxDuration = 300` — **obligatorio en cualquier endpoint de IA**. Vercel corta a ~60s por defecto y la generacion se cuelga en silencio con el spinner girando.
- Llaman a OpenAI con `fetch` directo a `https://api.openai.com/v1/...` (chat/completions, images/generations, images/edits) con `Authorization: Bearer ${process.env.OPENAI_API_KEY}`. El paquete `openai` esta instalado pero casi no se usa (solo [app/api/redes/texto/route.ts](app/api/redes/texto/route.ts)) — seguir el patron de fetch del archivo vecino.
- Modelos en uso: `gpt-4o` y `gpt-4o-mini` para texto/vision, `gpt-image-2` para imagenes, fal.ai `seedance/v1.5/pro` y `kling-video/v2.5-turbo/pro` para video.
- Respuestas: `NextResponse.json({...})` y `{ error }` con status; los errores se devuelven en espanol porque van directo a la UI.
- Prompts largos, diccionarios de opciones (fondos, efectos, audiencias, categorias) y config de modelo viven en constantes en la cabecera del route, no en archivos aparte. Ver [app/api/landing/imagen/route.ts](app/api/landing/imagen/route.ts) y [app/api/landing/video/route.ts](app/api/landing/video/route.ts).

### Landings publicadas

[app/api/publicar/route.ts](app/api/publicar/route.ts) recibe HTML ya armado en el cliente, lo guarda con un id corto aleatorio en `landings_publicadas` (service role), y [app/v/[id]/route.ts](app/v/%5Bid%5D/route.ts) lo sirve como documento HTML crudo — no es una pagina React, es una route handler que devuelve `text/html`. El pixel de Meta del vendedor (opcional, por landing) y los videos por seccion se inyectan en ese HTML en el momento de publicar. `/v/` y `/venezuela` estan excluidos del Navbar, Splash y padding (`MainWrapper`) para no marcar las landings del cliente.

### Biblioteca de Estilo -> motor de generacion

`lib/bibliotecaEstilo/` (vision, pdf, categorias, admin) analiza **una sola vez** con GPT-4o vision las referencias que sube un admin y guarda una ficha de texto en `biblioteca_estilo`. Despues, [app/api/redes-estrategico/generar/route.ts](app/api/redes-estrategico/generar/route.ts) toma UNA referencia activa al azar por categoria y la inyecta en el prompt como principio obligatorio, con prohibicion explicita de copiar frases literales. Es un banco **global** (no por usuario). Si se toca ese prompt, cuidar las dos reglas que ya costaron iteraciones: la ficha manda sobre el tono generico de venta, y esta prohibido reutilizar wording literal.

## Convenciones

- **Todo en espanol**: UI, prompts, mensajes de error, nombres de variables y funciones (`generarDolor`, `limpiarSesionLocal`, `obtenerSaldo`), comentarios. Los comentarios de codigo suelen ir **sin tildes**; los textos de UI si llevan tildes. Mantener el estilo del archivo que se edita.
- Archivos UTF-8 (varios empiezan con BOM). Las paginas son componentes `"use client"` grandes y monoliticos (1000-1600 lineas en `landing`, `redes-estrategico`, `redes-campanas`); no partirlos por gusto — se edita en el sitio.
- Alias de import `@/*` a la raiz.
- Rutas dinamicas de Next 16: `params` es una Promise (`{ params }: { params: Promise<{ id: string }> }` + `await params`).
- Nunca importar `lib/supabase/service.ts` ni tocar `SUPABASE_SERVICE_ROLE_KEY` desde un componente del navegador.

## Rarezas conocidas del repo

- [app/login/page.tsx](app/login/page.tsx) quedo colapsado en **una sola linea** (efecto de un `-NoNewline` de PowerShell). Funciona; editarlo con cuidado (buscar por texto, no por linea).
- Archivos muertos que conviene ignorar: `app/mastermind/page.tsx.respaldo`, `app/redes-estrategico-test/`, y PNGs viejos del mascota en `public/`.
- [app/anuncios/page.tsx](app/anuncios/page.tsx) llama a `api.anthropic.com` **desde el navegador y sin API key**: siempre falla y cae al `catch` con chips de dolor hardcodeados. Si se arregla, hay que moverlo a un API route.
- `CONTEXTO-COMPLETO (1).md` es la bitacora del proyecto (estado, decisiones, pendientes, aprendizajes de costo/modelo). Consultarlo antes de rehacer algo que ya se probo y descarto — por ejemplo Seedance 2.0 (moderacion rechaza fotos de producto) o el rediseno "Liquid Glass" del Navbar.
- El gasto real de creditos en la generacion de imagenes **todavia no esta encendido** a proposito (espera la activacion del billing). No activarlo sin pedirlo.

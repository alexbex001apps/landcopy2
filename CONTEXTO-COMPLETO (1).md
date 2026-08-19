# CONTEXTO COMPLETO — LandCopy 2.0 + Social Red — Para continuar en otra conversación

> Pega este documento completo al iniciar una nueva conversación (con Claude normal o Claude Code). Resume el estado real de ambos proyectos, el punto exacto donde quedó el trabajo, y cómo trabajamos.

> **Última actualización: 12 de agosto de 2026.** Desde el 2 de ago se hizo MUCHO más: se mejoró el video del producto (modelos, efectos, escenarios, fidelidad), y se ejecutó casi completa la **integración de Social Red dentro de LandCopy** (créditos, Biblioteca de Estilo, motor y pantalla del módulo, billing, pixel de landings, biblioteca de productos). Último commit en `main`: `128c8e5`. Todo en producción salvo el cobro real (espera aprobación del banco). Ver secciones nuevas **5F, 9, 10, 11, 12**. **Este proyecto se está migrando a Mac** — pasos al final (sección 13).

---

## 1. QUIÉN SOY Y CÓMO TRABAJAMOS

**Alejandro Becerra Fernández** ("Sabio", "Pastor", "Alejandro Bec") — venezolano-colombiano. Fundador de **BEC Media Group** y **Dunamixfy** (operación de e-commerce/dropshipping en Latinoamérica: Rodillax, Lumbrax, Relaxpie, Circulax, Menstruax — ~100 unidades/día en 5 países, +17,000 compradores). También soy **pastor de Iglesia Bethel en Medellín, Colombia**, y **autor** (no ficción como Alejandro Becerra Fernández, ficción como Alejandro Bec).

Trabajo principalmente desde el celular, o copiando/pegando comandos de PowerShell en Windows — **no programo directamente**, dependo de que se me den comandos exactos para copiar y pegar. **Leonel Duque** es mi socio real, ejecutor de las plataformas. Mi esposa **Carolina** es colaboradora clave en varios proyectos.

### Reglas de trabajo no negociables:
- **Proponer → esperar mi OK explícito → entregar una sola cosa a la vez.** Nunca código sin aprobación.
- Un comando de terminal a la vez, copiar/pegar. Siempre `cd` a la carpeta correcta primero.
- Para crear/editar archivos por PowerShell: usar `Get-Content`/`ForEach-Object`/`-replace` anclado por texto (nunca por número de línea), o here-strings con `Set-Content -Encoding UTF8`. **Nunca usar `-NoNewline` al reescribir archivos completos** — colapsa todas las líneas en una sola (ya nos pasó una vez con `login/page.tsx`).
- `.Replace()` de PowerShell falla seguido por espacios/CRLF invisibles — usar método línea por línea con `-match`/regex.
- Siempre `-Encoding UTF8` (textos en español con tildes).
- Después de cualquier cambio: `npm run build` antes de commit. Confirmar con `Select-String` que el cambio quedó bien insertado antes de seguir.
- Después de build limpio: `git add [archivos específicos]` + `git commit -m "..."` + `git push`. Confirmar "Ready" verde en Vercel.
- Antes de asumir el estado de un archivo, confirmar con `Get-Content`/`Select-String` en vez de dar por hecho — **tengo Claude Code corriendo en paralelo en VS Code**, puede haber tocado archivos sin que esta conversación lo sepa.
- Tono: español, coloquial colombiano, me gusta que me llamen "socio". Cierro sesiones importantes con un versículo bíblico.
- Valoro mucho la retroalimentación honesta sobre halagos vacíos.
- Los repos públicos (`landcopy2`) se pueden inspeccionar directo vía `curl https://raw.githubusercontent.com/alexbex001apps/[repo]/main/[ruta]` sin que yo tenga que pegar nada. El repo de `socialplanner`/Social Red parece ser **privado** (no accesible así).

---

## 2. LANDCOPY 2.0 — STACK Y ARQUITECTURA

- **Next.js (App Router) + TypeScript + Tailwind CSS**
- **Supabase** (Postgres + Auth + Storage), proyecto compartido con Social Red, ref `mrzkfethdxkfoostoaff`.
- **Vercel**, proyecto `landcopy2`, organización `landcopy` (plan Pro).
- **Repo GitHub**: `alexbex001apps/landcopy2` (público), carpeta local `C:\Users\aleja\landcopy2`.
- **Dominio propio**: `landcopy.app` (migrado desde `landcopy2.vercel.app` — ver sección 4).
- Módulos: `admin`, `anuncios`, `biblioteca`, `campaigns`, `copy`, `espera`, `landing`, `landing/video`, `login`, `mastermind`, `precios`, `redes`, `redes-campanas`, `redes-estrategico`, `venezuela`, etc.
- **Asistente IA — Leonel** (`app/api/leonel/route.ts`): UN SOLO asistente. Antes eran tres (Josué/Caleb/Nehemías = `api/josue`), pero se **fusionaron en Leonel**, que tiene los tres oficios en un solo cerebro: guía de plataforma + estrategia de ventas + análisis (FDRO, puntuaciones, comparaciones y métricas). Los archivos viejos `api/josue/route.ts` y `components/JosueChat.tsx` se **eliminaron**.
- **LeonelChat.tsx**: componente del chat flotante. Usa las poses del mascota Leonel (verde neón, mismas imágenes que Social Red) desde el bucket de Supabase `leonel-assets`. Botones "🔍 Analizar" en Campañas y Anuncios que abren el chat y le mandan la pieza a Leonel vía `window.leonelAnalizar(...)`.
- **OpenAI API**: se usa vía API directa (no ChatGPT Plus) — cuenta de facturación es de la empresa, gestionada aparte (no por mí directamente).
- **fal.ai API** (`FAL_API_KEY` en `.env.local` y Vercel): para la generación de video del producto (modelo Seedance Lite). Ver sección 5C. Cuenta propia con saldo prepago.

---

## 3. LANDCOPY 2.0 — MÓDULO LANDING: AUDIENCIA/TEMÁTICA (COMPLETADO Y EN PRODUCCIÓN)

Se construyó un sistema para que, antes de generar imágenes en el módulo Landing, se pueda elegir el público objetivo (audiencia), y esa selección afecta el prompt de generación de imágenes.

**Backend** (`app/api/landing/imagen/route.ts`):
- Diccionario `AUDIENCIAS` con 17 opciones: amas de casa, motociclistas, ciclistas, abogados, mecánicos, constructores, jóvenes, adultos mayores, deportistas, padres de familia, emprendedores, músicos, familias, ejecutivos, médicos, expertos en belleza, niños.
- Nuevos parámetros `audienciaId` / `audienciaCustom` (para "Otro", texto libre).
- El texto de audiencia se agrega al prompt final antes de generar la imagen. Si no se selecciona nada, funciona igual que antes (sin romper landings viejas).

**Frontend** (`app/landing/page.tsx`):
- Estado `audienciaSeleccionada` / `audienciaOtro`.
- Bloque de botones (los 17 + "Otro" con input de texto) insertado en el **Paso 1**, tanto en la vista de campaña activa como en la vista manual ("sin campaña"), antes del botón de generar.
- Ambas llamadas de generación de imagen mandan `audienciaId`/`audienciaCustom`.

**Estado:** compilado, commiteado (`e8d4b3f`), en producción, Vercel "Ready". **Aún no probado con imágenes reales** porque en el momento se agotó el saldo de la API de OpenAI de la empresa (ya se recargó después — pendiente hacer la prueba real de que las imágenes salgan enfocadas en la audiencia elegida).

---

## 4. LANDCOPY 2.0 — MIGRACIÓN DE DOMINIO (COMPLETADO)

- Dominio `landcopy.app` comprado en Namecheap, conectado a Vercel (registros DNS A `@` → `216.150.1.1` y CNAME `www` → `d175c1dc330f6d78.vercel-dns-016.com`).
- Ambos (`landcopy.app` y `www.landcopy.app`) en **"Valid Configuration"** en Vercel, con redirect apex→www funcionando.
- `redirectTo` de recuperación de contraseña en `app/login/page.tsx` actualizado de `landcopy2.vercel.app` a `landcopy.app` (commit `b0a12f4`).
- **Nota técnica:** en ese cambio, `app/login/page.tsx` quedó comprimido en una sola línea (efecto secundario de un `-NoNewline` mal usado). No rompe nada (JS/TS no necesita saltos de línea), pero es pendiente de limpieza estética.

---

## 5. LANDCOPY 2.0 — MASCOTA, SPLASH Y CHAT LEONEL (COMPLETADO Y EN PRODUCCIÓN)

**Decisión final:** en vez de crear un Leonel propio de LandCopy (el semirrealista de lentes que se había diseñado), se usó **el mismo mascota Leonel de Social Red** (verde neón), apuntando directo a sus poses en el bucket público de Supabase `leonel-assets` (mismo proyecto `mrzkfethdxkfoostoaff`). 9 poses: `leonel_master` (reposo), pensando, senalando, explicando, indice, laptop, celular, pulgar_arriba, brazos_cruzados. Ventaja: si se agrega una pose nueva, aparece en ambas plataformas sin tocar código. (Las 8 poses PNG semirrealistas viejas quedaron en `public/` sin uso, por si acaso.)

**Splash de entrada (`components/Splash.tsx`) — HECHO:**
- Solo el **logo de LandCopy** (`public/logo.png`, con su tagline "COPY QUE CONVIERTE. LANDINGS QUE VENDEN.") sobre negro, con glow naranja/amarillo pulsante, ~4s + fade. Igual de sobrio que el de Social Red (NO lleva a Leonel — se probó y se descartó).
- Se muestra **una vez por sesión**; **vuelve a salir al cerrar sesión** (`resetSplash()` / ahora vía `limpiarSesionLocal()`).
- Bloqueado en rutas públicas (`/v/`, `/share/`, `/venezuela`, `/ayuda-venezuela`) para no marcar las landings de los clientes.

**Chat de Leonel (`components/LeonelChat.tsx`) — HECHO:** reemplazó por completo al robot Josué. Panel idéntico al de Social Red (Leonel grande abajo a la derecha, poses al azar al responder). Panel con un ligero pulido de marca (degradado cálido, "En línea", mensajes de Leonel en tinte naranja).

---

## 5B. LANDCOPY 2.0 — LEONEL UNIFICADO + BOTONES DE ANÁLISIS (COMPLETADO Y EN PRODUCCIÓN)

- Los 3 especialistas (Josué/Caleb/Nehemías) se **fusionaron en un solo Leonel** (`app/api/leonel/route.ts`) con los tres oficios en un cerebro: guía de plataforma, estrategia de ventas, y análisis con formato FDRO + puntuaciones + comparaciones/métricas. Se le prohíbe mencionar a los especialistas viejos o "pestañas".
- **Leonel ya ve el contexto** de la sesión: campaña activa (+ foto), textos e imágenes de la landing, copy generado, headlines de anuncios.
- **Botones "🔍 Analizar"**: en Campañas (por tarjeta, manda la campaña con su foto sin activarla) y en Anuncios (temperatura, frases, producto, headlines). Usan `window.leonelAnalizar(pregunta, contexto, imagenes)` que expone el chat.
- Pendiente/futuro: botones de análisis también en Landing y Biblioteca; y "Etapa B" = que Leonel consulte Supabase directo (no solo la sesión).

---

## 5C. LANDCOPY 2.0 — VIDEO DEL PRODUCTO CON IA (COMPLETADO Y EN PRODUCCIÓN)

Genera un clip corto animando la **foto del producto** de la campaña, para landings de productos que no tienen creativos de video.

- **Endpoint** `app/api/landing/video/route.ts` (aislado, no toca nada): llama a **fal.ai modelo `fal-ai/bytedance/seedance/v1/lite/image-to-video`** (patrón de cola + polling), descarga el mp4 y lo sube al bucket `biblioteca-images`. Config (modelo, resolución 720p, duración 5s, prompt) en constantes arriba del archivo. `maxDuration = 300`.
- **Página** `app/landing/video/page.tsx`: lee la campaña activa, muestra la foto, y un **selector de efectos** (etiquetas en español, prompt en inglés) en 3 grupos: "Vende el beneficio" (demuestra el beneficio -dinámico desde la campaña-, repele agua, abriga, frescura, se enciende, resistente, en uso), "Con personas" (hombre/mujer usa o sostiene, modelo lo lleva puesto), y "Movimiento simple" (giro, zoom, luces, flotando, brillo, viento, humo). Descarga real (blob) y "Volver a Landing".
- **Colocar en la landing**: tras generar, se elige en qué **sección** va el video; se guarda en `sessionStorage.landing_videos`; la landing lo lee y en el export/publicación reproduce `<video autoplay loop muted playsinline>` en esa sección en vez de la imagen.
- Botón destacado (morado, "NUEVO") **"🎬 Generar VIDEO del producto"** en el panel de cada sección de Landing.

**Aprendizajes clave (importantes):**
- **Seedance 2.0 NO sirve** para productos: su moderación bloquea con falsos positivos ("personas") hasta con fotos de producto solo. **Lite sí funciona** y es ~8x más barato (~$0.18 por clip vs ~$1.50).
- **Lite SÍ anima personas** (2.0 las bloqueaba). Pero animar personas desde una foto de producto solo suele salir **deforme** (la IA las inventa); el grupo "Con personas" se dejó igual pero con esa advertencia.
- **Cambio de color** (blanco→negro→verde) sale glitcheado (manga bicolor); se descartó como opción fija.
- **Costo:** fal.ai prepago, recarga mínima $20 (≈110 clips con Lite). Avisa por correo cuando baja de $10. **Pendiente:** poner un tope por plan cuando haya usuarios reales.
- **Bug resuelto:** al pegar `FAL_API_KEY` en Vercel se coló un salto de línea → "invalid header value". Se corrigió el valor Y el código ahora limpia espacios con `.replace(/\s/g,"")`.

---

## 5D. LANDCOPY 2.0 — ARREGLOS DE ADMIN Y PRIVACIDAD (COMPLETADO Y EN PRODUCCIÓN)

- **Acceso de usuarios:** el registro pone `plan: "sin_acceso"` a propósito; el usuario queda en `/espera` hasta que yo lo active en `/admin` (planes: inicial, pro, completo). La columna `plan` de la tabla `users` es **exclusiva de LandCopy** — Social Red usa otras tablas (`subscriptions`, `plans`, etc.), así que activar a alguien aquí NO le da acceso allá (aunque el login/cuenta de Supabase es compartido).
- **Fix Admin:** el enlace de Admin no aparecía hasta recargar; ahora el Navbar lee el perfil en ambos caminos (`getSession` + `onAuthStateChange`).
- **Fix privacidad (importante):** al cerrar sesión NO se borraba el `sessionStorage`, así que el siguiente usuario del mismo navegador heredaba campaña/copys/landings del anterior. Se creó `lib/sesion.ts` con `limpiarSesionLocal()` (en los 3 puntos de logout) y `sincronizarUsuario()` (limpia si entra un usuario distinto). Nada de esto tocó la base de datos — era solo memoria del navegador.

---

## 5E. INTENTO DE REDISEÑO iOS 26 (DESCARTADO)

Se probó darle look "iOS 26 / Liquid Glass" (vidrio esmerilado) al Navbar y glow "Apple Intelligence" a Leonel. **No gustó** — sobre fondo negro puro el vidrio se pierde y el glow rayaba el chat. Todo se revirtió. Conclusión: si algún día se quiere ese look, primero hay que darle color/degradado sutil al fondo para que esos efectos luzcan. NO reintentarlo tal cual.

---

## 6. SOCIAL RED / SOCIAL PLANNER — BIBLIOTECA DE ESTILO (CONSTRUIDO Y EN PRUEBAS)

**Contexto:** Social Red (repo `alexbex001apps/socialplanner`, dominio `socialred.app`) es la plataforma hermana de LandCopy2, hoy se está desarrollando **directamente en Claude Code en VS Code** (ya no en esta conversación de Claude normal). Tiene su propio mascota "Leonel" (verde neón, distinto del Leonel de LandCopy) y su propio `CONTEXTO.md`.

**Origen de la idea:** Leonel Duque (el socio/ejecutor, no el mascota) pidió en 2 audios de WhatsApp:
1. Un banco de referencias de estilo real (carruseles, posts, guiones de Reels, historias) para que la IA se inspire en el formato/tono/estructura que ya usa el equipo — **sin copiar plantillas literales**.
2. (Pendiente, no iniciado) Un modo de "post único" con personalización ligera (2-3 campos), para casos como "hoy promociono la sopa del día", en vez de tener que armar un plan de 30 días completo.

**Lo que ya está construido y probado (idea 1 — Biblioteca de Estilo):**
- Pantalla `/biblioteca-estilo`: filtros por categoría (Carrusel, Post Instagram, Guion de Reel, Historia), formulario para agregar referencia (texto libre y/o **varias imágenes o PDF a la vez** — campo `imagenes_urls` como arreglo, no una sola imagen).
- Al subir una referencia con imágenes, la IA (GPT-4o con visión) las analiza **una sola vez** y genera automáticamente una ficha estructurada en 7 categorías: Estructura narrativa, Tono del copy, Gancho de apertura, Cierre/llamado a la acción, Paleta de colores, Estilo tipográfico, Uso de iconos/emojis. Esa ficha (no las imágenes) es lo que se reutiliza en cada generación futura (para no gastar visión repetidamente).
- Se puede **editar el texto de la ficha a mano** (botón "Editar texto") por si la IA describe algo mal o incompleto.
- Banco **global** (no por usuario/cliente) — administrado solo por mí y Leonel Duque, vía `BIBLIOTECA_ESTILO_ADMINS` (emails en variable de entorno, mismo patrón que Meta Pixel). Correos: `alexbex001@gmail.com`, `leonelduque132@gmail.com`.
- El motor de generación (`redes-estrategico/generar`) trae hasta **2 referencias activas al azar** por categoría y se las pasa a la IA como inspiración (se decidió dejarlo en 2 por ahora, no subir a 3-4, para probar primero con lo que ya está armado).
- Se probó generando una campaña real (chaqueta): **primera prueba** — la estructura narrativa y tipografía sí se parecían a la referencia, pero el color específico y el tono no se reflejaban bien. **Se ajustó** el prompt para inyectar la ficha como "Principio #6 obligatorio" con prioridad sobre el tono genérico de venta — **segunda prueba** — mejoró mucho (colores burdeos sí aparecieron, tono más conversacional), pero apareció un problema nuevo: **la IA copiaba frases literales de la referencia** (ej. "La ropa incómoda no es la solución" repetida palabra por palabra) — esto va en contra de la idea original de Leonel Duque (inspirarse, no clonar). **Se corrigió** agregando una prohibición explícita en el prompt ("PROHIBIDO TERMINANTE" copiar wording literal) — confirmado en código (líneas 46-48).

**Pendiente de probar/revisar (retomar aquí):**
1. **Volver a generar una prueba** con la corrección de "no copiar frases" ya aplicada (borrar la referencia de prueba, subirla de nuevo para que corra con el prompt más reciente, generar campaña, revisar si el texto ya no repite frases Y si el tono/color siguen bien).
2. **Confirmar si el color llega hasta la imagen real generada**, no solo hasta el texto/copy — Claude Code detectó que la generación de imagen pasa por otro endpoint (`redes-campanas/imagen`) con una plantilla fija de "urgencia/tono comercial" (caliente/tibio/frío) que podría competir con la paleta de colores de la referencia. Hay que darle clic a "Generar imagen real" (no solo ver el texto) para confirmar esto.
3. **Duda sin resolver:** al generar una campaña de un producto totalmente distinto (bicicleta) usando la referencia de estilo de otro producto (chaqueta), las 5 láminas del carrusel salieron con la frase de color **idéntica y repetida** ("dark neutral tones with white and burgundy accents") en las 5, sin variar. Sin confirmar aún si esto es: (a) comportamiento esperado del banco global (aplica a cualquier producto, tal como se diseñó), o (b) un bug real (debería generar una descripción distinta/variada por lámina en vez de pegar el mismo texto literal 5 veces). **Quedó pendiente de definir con Claude Code.**
4. **PDF de referencia:** aún no se ha probado subir un PDF (Leonel Duque tiene uno de guiones de historias, pendiente de que lo pase). Ya está soportado en el código (extrae texto Y convierte a imagen), solo falta un ejemplo real para probarlo.
5. **Idea 2 de Leonel Duque** (modo "post único" con personalización ligera): no iniciada, mencionada aquí para no perderla.

**Informe enviado a Leonel Duque por WhatsApp** resumiendo todo el avance de la Biblioteca de Estilo (ya entregado).

---

## 5F. LANDCOPY 2.0 — VIDEO DEL PRODUCTO: MEJORAS (COMPLETADO Y EN PRODUCCIÓN)

Sobre la feature de video (`app/api/landing/video/route.ts` + `app/landing/video/page.tsx`):
- **Modelo actual: Seedance v1.5 Pro** (fal). Se probó Lite (barato), 2.0 (rechazaba productos por moderación) y Kling 2.5 Turbo Pro. Hay **selector de calidad** en la página: "Estándar" (Seedance ~$0.26/5s) o "Alta fidelidad" (Kling ~$0.35/5s). El modelo/config viven en constantes arriba del route.
- **Selector de duración** 5s / 10s (10s cuesta el doble).
- **Efectos** en grupos: "Vende el beneficio", "Con personas", "Escenarios" (20: mesa giratoria, montaña, laboratorio, playa, etc.), "Movimiento simple". Etiquetas en español, prompt en inglés. Más un **campo de idea propia** (texto libre).
- **Fidelidad al producto reforzada** en el prompt: respeta proporciones, NO inventa logos/texto en superficies vacías, y si hay VARIAS unidades todas son idénticas. En efectos con personas: manos/objetos no atraviesan el cuerpo.
- **Arreglo clave:** imágenes muy panorámicas (ej. 1500x595) hacían que seedance las rechazara; se acomodan a cuadrado con `sharp` antes de enviar.
- El video se puede **poner en la sección de landing que elijas** (se reproduce autoplay/loop/muted en el HTML publicado).
- Se le puso `maxDuration = 300` a ese y a TODOS los endpoints de IA (imagen, anuncios, redes, etc.) porque Vercel cortaba las generaciones lentas a ~60s (la imagen se colgaba). Ese fue un bug real que se arregló.

---

## 9. INTEGRACIÓN SOCIAL RED → LANDCOPY (EN CURSO — LO MÁS IMPORTANTE)

**Decisión estratégica:** Social Red y LandCopy se fusionan en un solo producto. Como comparten el MISMO Supabase (`mrzkfethdxkfoostoaff`) y `auth.users`, se decidió **saldo/créditos COMPARTIDOS** (una cuenta, un saldo, sirve en las dos apps). **socialred.app NO se apaga** — sigue viva; LandCopy simplemente gana el módulo, que dentro de LandCopy se llama **"Social Planner"**. Regla: gana el más maduro (Social Red) — se trae su motor a LandCopy sin duplicar lógica (mismas tablas/funciones del Supabase compartido).

**Pasos ya HECHOS y en producción:**
1. **Créditos (base):** `lib/credits.ts` + `lib/supabase/service.ts` (llaman a las funciones Postgres `spend_credit`/`grant_credit` del Supabase compartido).
2. **Biblioteca de Estilo:** `lib/bibliotecaEstilo/` + `app/api/biblioteca-estilo/` + `app/biblioteca-estilo/page.tsx`. Se accede **desde el panel Admin** (es admin-only, banco global). Variable `BIBLIOTECA_ESTILO_ADMINS` ya en Vercel. Dependencia `pdf-parse`.
3. **Motor estratégico:** se reemplazó el viejo de LandCopy por el de Social Red (superset: auth + inyección de Biblioteca de Estilo + limpieza de láminas). Mismo contrato de entrada/salida.
4. **Pantalla del módulo:** se trajo la UI de Social Red como `app/redes-estrategico/page.tsx` (se quitó la landing de marketing `<Landing/>` que no aplica dentro de LandCopy).
5. **Billing (motor + precios):** `lib/payments/` + `lib/meta/events.ts` (pixel CAPI del SaaS) + `app/api/billing/` + `app/api/webhooks/lemon-squeezy` + pantalla `app/precios/page.tsx` (lee planes reales de la base). **Degrada solo:** sin `variant_id` ni credenciales, muestra "muy pronto".

**Lo que FALTA del billing (bloqueado por trámite externo, NO por código):**
- La **cuenta bancaria** de Lemon Squeezy está **en proceso de aprobación** (pasaporte venezolano, W-8BEN, Bancolombia). Hasta que se apruebe: crear los 5 productos en Lemon Squeezy → poner sus `ls_variant_id` en las tablas `plans`/`topup_packs` (hoy en NULL) → cargar `LEMON_SQUEEZY_API_KEY`, `LEMON_SQUEEZY_STORE_ID`, `LEMON_SQUEEZY_WEBHOOK_SECRET` + las `META_*` → configurar el webhook.
- **Encender el gasto de créditos en la generación de imágenes** (que descuente 1 crédito, con reembolso si falla, y bloquee sin saldo). Mejor encenderlo JUNTO con el banco, no antes. Planes decididos: Starter $9/25 img · Pro $19/100 · Agency $39/250 · packs 20img/$5 y 50img/$10. Costo ≈$0.07/imagen. Hay documento aparte: `SocialRed-Billing-para-LandCopy.pdf`.

---

## 10. PIXEL DE META EN LAS LANDINGS (COMPLETADO Y EN PRODUCCIÓN)

Distinto del pixel del billing. Es para que cada vendedor rastree **sus** ventas de producto. En el panel Publicar de Landing hay un campo **"Tu Pixel de Meta (opcional)"** (cada quien el suyo). La landing publicada incluye el código del pixel: dispara **PageView** al cargar y **Lead** al tocar "Comprar" (WhatsApp directo o formulario). Si no pone pixel, `lcLead()` queda vacío y no se inyecta nada. La comprobación final se hace en el Events Manager de Meta (no verificable desde el código).

---

## 11. BIBLIOTECA DE PRODUCTOS POR USUARIO (idea de Leonel Duque — Fases 1 y 2 HECHAS)

Cada usuario arma su banco de productos y los reutiliza al armar campañas, sin reescribir todo cada vez. **Tabla `productos`** (compartida, RLS por usuario) creada por SQL en Supabase.
- **Fase 1 (hecha):** pantalla `app/productos/page.tsx` + API `app/api/productos/`. Cada producto tiene: **tipo** (producto/negocio/marca), y campos RICOS (descripción amplia, detalle, problema, beneficio, lista de beneficios, público, precios, promoción, tono) + **hasta 8 imágenes, cada una con su propia descripción**. Regla clave: imágenes CON descripción = productos distintos (ej. cada pizza); SIN descripción = fotos del mismo producto. Se accede desde un botón en Social Planner.
- **Fase 2 (hecha):** en Social Planner (modo producto), botón "📦 Elegir de mi biblioteca" abre un selector; al elegir un producto, llena solo nombre, beneficio, problema y la primera imagen.
- **Fase 3 (PENDIENTE):** que TODO el detalle rico (lista de beneficios, precios, promoción, varias imágenes con descripción) llegue completo a la generación — es el corazón de lo que pidió Leonel. Toca el motor de generación. No se hizo aún para poder probarlo bien en local.

---

## 12. ESTADO DE LA MÁQUINA / SERVER LOCAL

En la última sesión el `npm run dev` local se cayó por **falta de memoria** de Windows ("archivo de paginación demasiado pequeño" / os error 1450) — muchas pestañas del navegador + servidores zombis. El código estaba bien (`npm run build` compilaba). Por eso lo último se probó **directo en producción**. Al migrar a Mac esto se resuelve (más RAM / entorno limpio).

---

## 13. MIGRACIÓN A MAC — PASOS (leer esto primero al llegar al Mac)

Todo el código está en GitHub (`alexbex001apps/landcopy2`), así que migrar es clonar. Lo ÚNICO que no viaja por GitHub es `.env.local` (secretos). Pasos:
1. Instalar **Node.js** (versión 20+) y **Git** en el Mac.
2. Clonar: `git clone https://github.com/alexbex001apps/landcopy2.git`
3. Entrar: `cd landcopy2`
4. **Recrear `.env.local`** en la raíz con estas 7 variables (copiar los VALORES del `.env.local` de Windows — están en `C:\Users\aleja\landcopy2\.env.local`): `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FAL_API_KEY`, `BIBLIOTECA_ESTILO_ADMINS`. (Las de Lemon Squeezy y Meta se agregan cuando se active el billing.)
5. Instalar dependencias: `npm install`
6. Levantar: `npm run dev` → abrir `http://localhost:3000`
7. Nota: el terminal del Mac usa bash/zsh normal (no PowerShell) — los comandos de Windows del pasado ya no aplican; en Mac es todo Unix estándar.

---

## 7. RESUMEN DE PRÓXIMOS PASOS (en orden sugerido)

**PRIMERO al llegar al Mac:** seguir la sección 13 (clonar + recrear `.env.local` + `npm install` + `npm run dev`).

**Billing (bloqueado por el banco — sección 9):**
1. Cuando **aprueben la cuenta bancaria** de Lemon Squeezy: crear los 5 productos → poner los `ls_variant_id` en `plans`/`topup_packs` → cargar las variables `LEMON_SQUEEZY_*` y `META_*` en `.env.local` y Vercel → configurar el webhook.
2. **Encender el gasto de créditos** en la generación de imágenes (descontar 1, reembolsar si falla, bloquear sin saldo) — JUNTO con el banco, no antes.

**Biblioteca de productos (sección 11):**
3. **Fase 3:** que el detalle rico del producto (lista de beneficios, precios, promoción, varias imágenes con descripción) llegue completo al motor de generación.

**LandCopy — pendientes:**
4. Extender botones de análisis de Leonel a Landing y Biblioteca (ya están en Campañas y Anuncios).
5. Actualizar el cerebro de Leonel (`api/leonel/route.ts`) con lo nuevo: Biblioteca de Estilo, biblioteca de productos, calidad/duración de video.
6. Probar el sistema de audiencia/temática del módulo Landing con imágenes reales.
7. Limpiar `app/login/page.tsx` (quedó en una sola línea).
8. Seguridad: rotar `OPENAI_API_KEY` y Supabase Service Role Key.

**Housekeeping:**
9. Este documento mezcla LandCopy y Social Red — conviene partirlo en dos.
10. La Biblioteca de Estilo y la de productos son features de Social Red también — si se sigue desarrollando socialred.app aparte, replicar el frontend allá o vivir con la divergencia.

---

## 8. CONTEXTO PERSONAL Y DE NEGOCIO (para tono y referencias)

- Libros de no ficción (Alejandro Becerra Fernández): "Raíces de Iniquidad", "40 Consejos Financieros Que Nadie Te Da", "No Es Cansancio. Es Ruido.", "El Gran Desafío", "Pensamientos Poderosos Para Cada Día", entre otros.
- Ficción (Alejandro Bec): "Ideas Rotas" (completo), saga "El Que Viene" (9 capítulos escritos, próximo: Cap. 10).
- Otras plataformas conceptualizadas: NEXXO, VECINAS, PREGÚNTALE, TABLERO, BONO, LEEMOS, RECONCILIA, WAKORO.
- Sermones: preparo sermones completos en español con datos científicos verificados, estilo Dante Gebel, para Iglesia Bethel.
- Dunamix: marca de salud natural, gran base de contactos vía WhatsApp, cuenta de TikTok dormida (@iglesiabethel) con un video viral previo.

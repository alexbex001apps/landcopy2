// Describe con IA (vision) el formato/estilo de una o varias imagenes de referencia,
// para usarlo como texto_plano cuando el admin no escribio una descripcion manual.
// Se corre UNA SOLA VEZ al subir la referencia, no en cada generacion de campaña.
export async function describirImagenesConIA(
  imagenes: { buffer: Buffer; mime: string }[],
  categoria: string
): Promise<string> {
  if (imagenes.length === 0) return "";
  try {
    const content: any[] = [
      {
        type: "text",
        text: `Estas son las imagenes de una referencia de estilo real de la marca, categoria "${categoria}", en orden (si son varias, son laminas de un mismo carrusel). Analizalas y devuelve una ficha en español con EXACTAMENTE estas líneas, cada una con su etiqueta (si algo no aplica o no se puede determinar, escribe "No aplica"), sin agregar nada antes ni después:
Estructura narrativa: ...
Tono del copy: ...
Gancho de apertura: ...
Cierre o llamado a la accion: ...
Paleta de colores: ...
Estilo tipografico: ...
Uso de iconos o emojis: ...
Esto se usara como referencia de inspiracion para que una IA genere contenido nuevo con el mismo formato, NO para copiarlo literal.`,
      },
    ];
    for (const img of imagenes.slice(0, 8)) {
      content.push({
        type: "image_url",
        image_url: { url: `data:${img.mime};base64,${img.buffer.toString("base64")}` },
      });
    }

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 500,
        messages: [{ role: "user", content }],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) return "";
    return (data.choices?.[0]?.message?.content || "").trim();
  } catch {
    return "";
  }
}

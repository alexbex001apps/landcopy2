export const CATEGORIAS_ESTILO = ["carrusel", "post_instagram", "guion_reel", "historia"] as const;
export type CategoriaEstilo = (typeof CATEGORIAS_ESTILO)[number];

export const LABEL_CATEGORIA_ESTILO: Record<CategoriaEstilo, string> = {
  carrusel: "Carrusel",
  post_instagram: "Post Instagram",
  guion_reel: "Guion de Reel",
  historia: "Historia",
};

// Mapea el "tipo" libre que la IA le pone a cada pieza (carrusel, reel, imagen,
// testimonio, detras de camaras, etc — no es un enum cerrado) a una de las 4
// categorias del banco de estilo, para saber que referencia visual aplicarle.
export function categoriaEstiloDeTipo(tipo: string): CategoriaEstilo {
  const t = (tipo || "").toLowerCase();
  if (t.includes("carrusel")) return "carrusel";
  if (t.includes("reel") || t.includes("video")) return "guion_reel";
  if (t.includes("historia") && !t.includes("cliente")) return "historia";
  return "post_instagram";
}

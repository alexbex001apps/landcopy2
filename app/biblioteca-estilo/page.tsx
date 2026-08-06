"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIAS_ESTILO, LABEL_CATEGORIA_ESTILO, CategoriaEstilo } from "@/lib/bibliotecaEstilo/categorias";

type Referencia = {
  id: string;
  categoria: CategoriaEstilo;
  titulo: string | null;
  texto_plano: string | null;
  imagenes_urls: string[] | null;
  pdf_url: string | null;
  activa: boolean;
  created_at: string;
  created_by: string | null;
};

export default function BibliotecaEstilo() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);
  const [referencias, setReferencias] = useState<Referencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [textoEditado, setTextoEditado] = useState("");

  const [fCategoria, setFCategoria] = useState<CategoriaEstilo>("carrusel");
  const [fTitulo, setFTitulo] = useState("");
  const [fTexto, setFTexto] = useState("");
  const [fArchivos, setFArchivos] = useState<File[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      cargarReferencias();
    });
  }, []);

  async function cargarReferencias() {
    setCargando(true);
    try {
      const resp = await fetch("/api/biblioteca-estilo");
      if (resp.status === 403) {
        router.push("/");
        return;
      }
      const data = await resp.json();
      if (resp.ok) setReferencias(data.referencias || []);
      setVerificando(false);
    } catch {
      setVerificando(false);
    }
    setCargando(false);
  }

  // Redimensiona y recomprime una imagen para que varias fotos juntas no
  // superen el limite de tamano de peticion de las funciones serverless (Vercel: 4.5MB).
  async function comprimirImagen(file: File, maxDim = 1600, calidad = 0.82): Promise<File> {
    if (!file.type.startsWith("image/")) return file;
    try {
      const bitmap = await createImageBitmap(file);
      let { width, height } = bitmap;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, width, height);
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", calidad));
      if (!blob) return file;
      return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
    } catch {
      return file;
    }
  }

  async function agregarReferencia(e: React.FormEvent) {
    e.preventDefault();
    if (!fTexto.trim() && fArchivos.length === 0) {
      setError("Pega un texto, sube un PDF o sube una o varias imagenes.");
      return;
    }
    setError("");
    setEnviando(true);
    try {
      const form = new FormData();
      form.append("categoria", fCategoria);
      form.append("titulo", fTitulo);
      form.append("texto", fTexto);
      const archivosComprimidos = await Promise.all(fArchivos.map((a) => comprimirImagen(a)));
      archivosComprimidos.forEach((archivo) => form.append("archivo", archivo));

      const resp = await fetch("/api/biblioteca-estilo", { method: "POST", body: form });
      let data: any = {};
      try {
        data = await resp.json();
      } catch {
        data = { error: resp.status === 413 ? "Los archivos son muy pesados. Intenta con menos imagenes o mas livianas." : `Error del servidor (${resp.status})` };
      }
      if (!resp.ok) {
        setError(data.error || "Error al guardar la referencia");
      } else {
        setReferencias((prev) => [data.referencia, ...prev]);
        setFTitulo("");
        setFTexto("");
        setFArchivos([]);
        setMostrarForm(false);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setEnviando(false);
  }

  async function toggleActiva(id: string, valorActual: boolean) {
    try {
      const resp = await fetch(`/api/biblioteca-estilo/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activa: !valorActual }),
      });
      if (resp.ok) {
        setReferencias((prev) => prev.map((r) => (r.id === id ? { ...r, activa: !valorActual } : r)));
      }
    } catch {}
  }

  async function guardarTexto(id: string, textoPlano: string) {
    try {
      const resp = await fetch(`/api/biblioteca-estilo/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto_plano: textoPlano }),
      });
      if (resp.ok) {
        setReferencias((prev) => prev.map((r) => (r.id === id ? { ...r, texto_plano: textoPlano } : r)));
        setEditandoId(null);
      }
    } catch {}
  }

  async function eliminarReferencia(id: string) {
    if (!confirm("Eliminar esta referencia del banco de estilo? No se puede deshacer.")) return;
    try {
      const resp = await fetch(`/api/biblioteca-estilo/${id}`, { method: "DELETE" });
      if (resp.ok) setReferencias((prev) => prev.filter((r) => r.id !== id));
    } catch {}
  }

  const referenciasFiltradas = useMemo(() => {
    if (filtroCategoria === "todas") return referencias;
    return referencias.filter((r) => r.categoria === filtroCategoria);
  }, [referencias, filtroCategoria]);

  if (verificando) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F0E8] px-4 py-8 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black">Biblioteca de Estilo</h1>
            <p className="text-white/50 text-sm">Banco global de referencias reales para inspirar a la IA (no plantillas fijas).</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-white/60 hover:text-white border border-white/10 rounded-full px-4 py-2"
          >
            Volver
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroCategoria("todas")}
              className={`text-xs font-bold px-3 py-2 rounded-lg ${filtroCategoria === "todas" ? "bg-white text-black" : "bg-white/5 text-white/60"}`}
            >
              Todas
            </button>
            {CATEGORIAS_ESTILO.map((c) => (
              <button
                key={c}
                onClick={() => setFiltroCategoria(c)}
                className={`text-xs font-bold px-3 py-2 rounded-lg ${filtroCategoria === c ? "bg-white text-black" : "bg-white/5 text-white/60"}`}
              >
                {LABEL_CATEGORIA_ESTILO[c]}
              </button>
            ))}
          </div>

          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="text-sm font-bold bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 rounded-lg px-4 py-2"
          >
            {mostrarForm ? "Cancelar" : "+ Agregar referencia"}
          </button>
        </div>

        {mostrarForm && (
          <form onSubmit={agregarReferencia} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-6 space-y-3">
            <div className="flex flex-wrap gap-3">
              <select
                value={fCategoria}
                onChange={(e) => setFCategoria(e.target.value as CategoriaEstilo)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
                {CATEGORIAS_ESTILO.map((c) => (
                  <option key={c} value={c} style={{ color: "#000" }}>{LABEL_CATEGORIA_ESTILO[c]}</option>
                ))}
              </select>
              <input
                value={fTitulo}
                onChange={(e) => setFTitulo(e.target.value)}
                placeholder="Titulo (opcional, para identificarla)"
                className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30"
              />
            </div>

            <textarea
              value={fTexto}
              onChange={(e) => setFTexto(e.target.value)}
              placeholder="Pega el texto/guion de referencia (opcional si subes un archivo)"
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30"
            />

            <div>
              <label className="text-xs text-white/50 block mb-1">
                PDF o imagen(es) de referencia (opcional). Para un carrusel completo: sube UN PDF con todas las laminas, o VARIAS imagenes (una por lamina, en orden).
              </label>
              <input
                type="file"
                accept="application/pdf,image/*"
                multiple
                onChange={(e) => setFArchivos(Array.from(e.target.files || []))}
                className="text-sm text-white/70 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:text-xs file:font-bold hover:file:bg-white/15 file:cursor-pointer cursor-pointer"
              />
              {fArchivos.length > 1 && (
                <p className="text-xs text-white/40 mt-1">{fArchivos.length} archivos seleccionados.</p>
              )}
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="text-sm font-bold bg-white text-black rounded-lg px-4 py-2 disabled:opacity-50"
            >
              {enviando ? "Guardando..." : "Guardar referencia"}
            </button>
          </form>
        )}

        {cargando ? (
          <p className="text-white/40 text-sm">Cargando referencias...</p>
        ) : referenciasFiltradas.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <p className="text-lg mb-1">Aun no hay referencias en esta categoria.</p>
            <p className="text-sm">Agrega ejemplos reales para que la IA los use como inspiracion de estilo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {referenciasFiltradas.map((r) => (
              <div key={r.id} className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                <div className="h-36 bg-black/40 flex items-center justify-center overflow-hidden relative">
                  {r.imagenes_urls && r.imagenes_urls.length > 0 ? (
                    <img src={r.imagenes_urls[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white/20 text-xs">Sin imagen</span>
                  )}
                  {r.imagenes_urls && r.imagenes_urls.length > 1 && (
                    <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-black/70 text-white px-2 py-1 rounded-full">
                      +{r.imagenes_urls.length - 1}
                    </span>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-cyan-400/10 text-cyan-400">
                      {LABEL_CATEGORIA_ESTILO[r.categoria]}
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${r.activa ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"}`}>
                      {r.activa ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  <p className="font-bold text-sm">{r.titulo || "Sin titulo"}</p>
                  {r.texto_plano && <p className="text-white/50 text-xs line-clamp-3">{r.texto_plano}</p>}

                  <div className="flex gap-2 mt-auto pt-3">
                    {((r.imagenes_urls && r.imagenes_urls.length > 1) || (r.texto_plano && r.texto_plano.length > 160)) && (
                      <button
                        onClick={() => setExpandidoId(expandidoId === r.id ? null : r.id)}
                        className="flex-1 text-xs font-bold bg-white/10 hover:bg-white/15 rounded-lg py-2"
                      >
                        {expandidoId === r.id ? "Ocultar" : "Ver detalles"}
                      </button>
                    )}
                    <button
                      onClick={() => toggleActiva(r.id, r.activa)}
                      className="flex-1 text-xs font-bold bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 rounded-lg py-2"
                    >
                      {r.activa ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      onClick={() => eliminarReferencia(r.id)}
                      className="text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg px-3 py-2"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {expandidoId === r.id && (
                  <div className="border-t border-white/10 p-4 bg-black/20 space-y-3">
                    {editandoId === r.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={textoEditado}
                          onChange={(e) => setTextoEditado(e.target.value)}
                          rows={8}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 outline-none focus:border-white/30"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => guardarTexto(r.id, textoEditado)}
                            className="text-xs font-bold bg-white text-black rounded-lg px-4 py-2"
                          >
                            Guardar texto
                          </button>
                          <button
                            onClick={() => setEditandoId(null)}
                            className="text-xs font-bold bg-white/10 hover:bg-white/15 rounded-lg px-4 py-2"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {r.texto_plano && (
                          <p className="text-white/70 text-xs whitespace-pre-wrap mb-2">{r.texto_plano}</p>
                        )}
                        <button
                          onClick={() => { setEditandoId(r.id); setTextoEditado(r.texto_plano || ""); }}
                          className="text-xs font-bold text-cyan-400 hover:text-cyan-300"
                        >
                          Editar texto
                        </button>
                      </div>
                    )}
                    {r.imagenes_urls && r.imagenes_urls.length > 1 && (
                      <div>
                        <p className="text-xs text-white/40 mb-2">Laminas en orden ({r.imagenes_urls.length}):</p>
                        <div className="flex gap-2 overflow-x-auto">
                          {r.imagenes_urls.map((url, i) => (
                            <div key={i} className="shrink-0 flex flex-col items-center gap-1">
                              <img src={url} alt="" className="h-40 w-auto rounded-lg border border-white/10" />
                              <span className="text-[10px] text-white/40">#{i + 1}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

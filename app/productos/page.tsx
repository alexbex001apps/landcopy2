"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Imagen = { url: string; descripcion: string };
type Producto = {
  id: string;
  tipo: string | null;
  nombre: string;
  descripcion: string | null;
  detalle: string | null;
  problema: string | null;
  beneficio: string | null;
  beneficios: string[] | null;
  publico_objetivo: string | null;
  precio: string | null;
  precio_oferta: string | null;
  precio_anterior: string | null;
  promocion: string | null;
  tono: string | null;
  imagenes: Imagen[] | null;
};

const TIPOS = [
  { id: "producto", emoji: "📦", label: "Un producto" },
  { id: "negocio", emoji: "🏪", label: "Negocio local" },
  { id: "marca", emoji: "⭐", label: "Marca personal" },
];

const VACIO = {
  tipo: "producto", nombre: "", descripcion: "", detalle: "", problema: "", beneficio: "",
  beneficios: "", publico_objetivo: "", precio: "", precio_oferta: "",
  precio_anterior: "", promocion: "", tono: "", imagenes: [] as Imagen[],
};

export default function Productos() {
  const supabase = createClient();
  const [lista, setLista] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState<typeof VACIO>(VACIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const aviso = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  const cargar = async () => {
    setCargando(true);
    try {
      const r = await fetch("/api/productos").then((x) => x.json());
      setLista(r.productos || []);
    } catch {}
    setCargando(false);
  };
  useEffect(() => { cargar(); }, []);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const abrirNuevo = () => { setForm(VACIO); setEditandoId(null); setMostrarForm(true); };
  const abrirEditar = (p: Producto) => {
    setForm({
      tipo: p.tipo || "producto", nombre: p.nombre || "", descripcion: p.descripcion || "",
      detalle: p.detalle || "", problema: p.problema || "", beneficio: p.beneficio || "",
      beneficios: (p.beneficios || []).join("\n"),
      publico_objetivo: p.publico_objetivo || "", precio: p.precio || "",
      precio_oferta: p.precio_oferta || "", precio_anterior: p.precio_anterior || "",
      promocion: p.promocion || "", tono: p.tono || "",
      imagenes: p.imagenes || [],
    });
    setEditandoId(p.id);
    setMostrarForm(true);
  };

  const subirImagen = async (file: File) => {
    if (form.imagenes.length >= 8) { aviso("Máximo 8 imágenes"); return; }
    setSubiendo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const path = `${user?.id}/productos/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      await supabase.storage.from("biblioteca-images").upload(path, file, { contentType: file.type || "image/jpeg" });
      const { data } = supabase.storage.from("biblioteca-images").getPublicUrl(path);
      if (data?.publicUrl) set("imagenes", [...form.imagenes, { url: data.publicUrl, descripcion: "" }]);
    } catch { aviso("No se pudo subir la imagen"); }
    setSubiendo(false);
  };

  const quitarImagen = (url: string) => set("imagenes", form.imagenes.filter((im) => im.url !== url));
  const descImagen = (url: string, desc: string) =>
    set("imagenes", form.imagenes.map((im) => im.url === url ? { ...im, descripcion: desc } : im));

  const guardar = async () => {
    if (!form.nombre.trim()) { aviso("Ponle un nombre"); return; }
    setGuardando(true);
    try {
      const body = {
        ...form,
        beneficios: form.beneficios.split("\n").map((b) => b.trim()).filter(Boolean),
      };
      const url = editandoId ? `/api/productos/${editandoId}` : "/api/productos";
      const method = editandoId ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((x) => x.json());
      if (r.producto) { aviso(editandoId ? "Producto actualizado" : "Producto creado"); setMostrarForm(false); cargar(); }
      else aviso(r.error || "No se pudo guardar");
    } catch { aviso("Error al guardar"); }
    setGuardando(false);
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Borrar este producto de tu biblioteca?")) return;
    try { await fetch(`/api/productos/${id}`, { method: "DELETE" }); cargar(); } catch {}
  };

  const inputCls = "w-full bg-[#111] border border-[#1a1a1a] text-[#f0ead6] text-sm px-3 py-2 rounded-lg outline-none focus:border-orange-500/50";
  const labelCls = "text-yellow-400 text-[10px] font-bold uppercase tracking-wider mb-1 block";
  const tipoLabel = (t: string | null) => TIPOS.find((x) => x.id === t)?.label || "Producto";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-black text-white">📦 Mi biblioteca de productos</h1>
        {!mostrarForm && <button onClick={abrirNuevo} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">➕ Nuevo</button>}
      </div>
      <p className="text-zinc-500 text-xs mb-5">Crea tus productos una vez con toda su información. Después los eliges al armar una campaña, sin volver a escribir nada.</p>

      {mostrarForm ? (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4 space-y-4">
          {/* Tipo */}
          <div>
            <label className={labelCls}>¿Qué es?</label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS.map((t) => (
                <button key={t.id} onClick={() => set("tipo", t.id)} className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-[11px] font-bold transition-colors ${form.tipo === t.id ? "bg-orange-500/20 border-orange-500 text-orange-200" : "bg-[#111] border-[#1a1a1a] text-zinc-400 hover:border-[#333]"}`}>
                  <span className="text-lg leading-none">{t.emoji}</span>{t.label}
                </button>
              ))}
            </div>
          </div>

          <div><label className={labelCls}>Nombre *</label><input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} className={inputCls} placeholder={form.tipo === "negocio" ? "Ej: Pizzería Doña Rosa" : form.tipo === "marca" ? "Tu nombre / marca" : "Ej: Vaporizador de viaje"} /></div>

          <div><label className={labelCls}>Descripción amplia</label><textarea value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} rows={3} className={inputCls} placeholder="Qué es, con detalle..." /></div>

          <div><label className={labelCls}>Detalle / características</label><textarea value={form.detalle} onChange={(e) => set("detalle", e.target.value)} rows={3} className={inputCls} placeholder="Materiales, medidas, cómo se usa..." /></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={labelCls}>Problema que resuelve</label><textarea value={form.problema} onChange={(e) => set("problema", e.target.value)} rows={2} className={inputCls} /></div>
            <div><label className={labelCls}>Beneficio principal</label><textarea value={form.beneficio} onChange={(e) => set("beneficio", e.target.value)} rows={2} className={inputCls} /></div>
          </div>

          <div><label className={labelCls}>Lista de beneficios (uno por línea)</label><textarea value={form.beneficios} onChange={(e) => set("beneficios", e.target.value)} rows={4} className={inputCls} placeholder={"Ahorra tiempo\nFácil de llevar\nResultados en minutos"} /></div>

          <div><label className={labelCls}>Público objetivo</label><input value={form.publico_objetivo} onChange={(e) => set("publico_objetivo", e.target.value)} className={inputCls} placeholder="¿A quién le sirve?" /></div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelCls}>Precio</label><input value={form.precio} onChange={(e) => set("precio", e.target.value)} className={inputCls} placeholder="$45.000" /></div>
            <div><label className={labelCls}>Precio oferta</label><input value={form.precio_oferta} onChange={(e) => set("precio_oferta", e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Precio anterior</label><input value={form.precio_anterior} onChange={(e) => set("precio_anterior", e.target.value)} className={inputCls} /></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={labelCls}>Promoción</label><input value={form.promocion} onChange={(e) => set("promocion", e.target.value)} className={inputCls} placeholder="2x1, envío gratis..." /></div>
            <div><label className={labelCls}>Tono / voz (opcional)</label><input value={form.tono} onChange={(e) => set("tono", e.target.value)} className={inputCls} placeholder="Cercano, premium..." /></div>
          </div>

          {/* Imágenes con descripción por imagen */}
          <div>
            <label className={labelCls}>Imágenes (hasta 8)</label>
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-2.5 mb-2">
              <p className="text-zinc-500 text-[10px] leading-snug">💡 Si le pones <span className="text-orange-300 font-bold">descripción a cada imagen</span>, se entiende que son productos <span className="text-orange-300 font-bold">distintos</span> (ej: cada pizza del menú). Si las dejas <span className="text-orange-300 font-bold">sin descripción</span>, se entiende que son fotos del <span className="text-orange-300 font-bold">mismo</span> producto.</p>
            </div>
            <div className="space-y-2">
              {form.imagenes.map((im) => (
                <div key={im.url} className="flex gap-2 items-start bg-[#111] border border-[#1a1a1a] rounded-lg p-2">
                  <div className="relative flex-shrink-0">
                    <img src={im.url} className="w-16 h-16 object-cover rounded-lg" />
                    <button onClick={() => quitarImagen(im.url)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full">✕</button>
                  </div>
                  <input value={im.descripcion} onChange={(e) => descImagen(im.url, e.target.value)} className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] text-[#f0ead6] text-[12px] px-2.5 py-2 rounded-lg outline-none focus:border-orange-500/50" placeholder="Descripción de ESTA imagen (opcional). Ej: Pizza pepperoni grande" />
                </div>
              ))}
              {form.imagenes.length < 8 && (
                <label className="w-full border border-dashed border-[#333] rounded-lg flex items-center justify-center cursor-pointer text-zinc-500 text-sm py-3 hover:border-orange-500">
                  {subiendo ? "Subiendo…" : "+ Agregar imagen"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) subirImagen(f); e.target.value = ""; }} />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={() => setMostrarForm(false)} className="flex-1 border border-[#1a1a1a] text-zinc-400 text-sm font-bold py-3 rounded-xl">Cancelar</button>
            <button onClick={guardar} disabled={guardando} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-3 rounded-xl disabled:opacity-40">{guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Crear producto"}</button>
          </div>
        </div>
      ) : cargando ? (
        <p className="text-zinc-600 text-sm">Cargando...</p>
      ) : lista.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-white font-bold mb-1">Aún no tienes productos</p>
          <p className="text-zinc-500 text-xs mb-4">Crea tu primero para poder elegirlo al armar campañas.</p>
          <button onClick={abrirNuevo} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-6 py-3 rounded-xl">➕ Crear producto</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lista.map((p) => (
            <div key={p.id} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-3">
              <div className="flex items-center gap-3 mb-2">
                {p.imagenes?.[0]?.url
                  ? <img src={p.imagenes[0].url} className="w-14 h-14 object-cover rounded-lg bg-[#111] flex-shrink-0" />
                  : <div className="w-14 h-14 bg-[#111] rounded-lg flex items-center justify-center text-xl flex-shrink-0">📦</div>}
                <div className="min-w-0">
                  <p className="text-white text-sm font-bold truncate">{p.nombre}</p>
                  <p className="text-orange-400/80 text-[10px]">{tipoLabel(p.tipo)}</p>
                  <p className="text-zinc-600 text-[10px]">{(p.imagenes?.length || 0)} img · {(p.beneficios?.length || 0)} beneficios</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={() => abrirEditar(p)} className="text-[11px] font-bold text-orange-400 border border-orange-500/30 hover:bg-orange-500/10 py-2 rounded-lg transition-colors">✎ Editar</button>
                <button onClick={() => eliminar(p.id)} className="text-[11px] font-bold text-zinc-600 hover:text-red-400 border border-[#1a1a1a] hover:border-red-400/40 py-2 rounded-lg transition-colors">🗑️ Borrar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-500 text-green-950 text-sm font-bold px-5 py-3 rounded-xl shadow-xl z-50">{toast}</div>}
    </div>
  );
}

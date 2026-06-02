"use client";
import { useEffect, useState } from "react";

export default function Anuncios() {
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [producto, setProducto] = useState<any>(null);

  useEffect(() => {
    const h = sessionStorage.getItem("anuncios_headlines");
    const p = sessionStorage.getItem("anuncios_producto");
    if (h) setHeadlines(JSON.parse(h));
    if (p) setProducto(JSON.parse(p));
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center space-y-8">
        <div className="space-y-2">
          <div className="inline-block bg-orange-500/10 border border-orange-500/30 text-orange-500 text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">Próximamente</div>
          <h1 className="text-4xl font-black text-white">Módulo <span className="text-orange-500">Anuncios</span></h1>
          <p className="text-zinc-500 text-sm">Genera imágenes de anuncio profesionales con tu producto y copy encima. Sin Canva. Sin diseñador.</p>
        </div>

        {headlines.length > 0 && (
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 text-left space-y-3">
            <p className="text-zinc-600 text-[10px] font-bold tracking-widest uppercase">Headlines recibidos desde Copy</p>
            {headlines.map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">{i + 1}</span>
                <p className="text-[#f0ead6] text-xs leading-relaxed">{h}</p>
              </div>
            ))}
            {producto && (
              <p className="text-zinc-600 text-[10px] pt-2 border-t border-[#1a1a1a]">Producto: <span className="text-zinc-400">{producto.producto}</span></p>
            )}
          </div>
        )}

        <a href="/copy" className="inline-block bg-[#0a0a0a] border border-[#1a1a1a] text-zinc-400 text-xs font-bold px-4 py-2 rounded-lg hover:border-[#333] transition-colors">← Volver a Copy</a>
      </div>
    </div>
  );
}
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function SharePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: copy } = await supabase
    .from("copys_guardados")
    .select("*")
    .eq("id", params.id)
    .eq("compartible", true)
    .single();

  if (!copy) return notFound();

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6 py-20">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-500 text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
            LandCopy · Copy compartido
          </div>
          <h1 className="text-2xl font-black text-white mb-1">{copy.producto}</h1>
          <p className="text-zinc-500 text-sm">{copy.tipo} · {copy.hora}</p>
        </div>

        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#151515]">
            <span className="text-orange-500 text-[10px] font-bold tracking-widest uppercase">{copy.tipo}</span>
            <button
              onClick={() => navigator.clipboard.writeText(copy.texto)}
              className="bg-[#111] border border-[#1e1e1e] text-zinc-400 text-[10px] font-bold px-3 py-1.5 rounded-md"
            >
              Copiar texto
            </button>
          </div>
          <p className="text-[#f0ead6] text-sm leading-relaxed whitespace-pre-wrap">{copy.texto}</p>
        </div>

        <div className="text-center mt-6">
          <a href="https://landcopy2.vercel.app" className="text-zinc-600 text-xs hover:text-orange-500 transition-colors">
            Crear mi propio copy con LandCopy →
          </a>
        </div>
      </div>
    </div>
  );
}
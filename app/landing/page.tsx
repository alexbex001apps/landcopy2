"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Landing() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = "/login";
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-cyan-400 text-6xl mb-4">🖼️</div>
        <h1 className="text-2xl font-black text-white mb-2">Módulo Landing Page</h1>
        <p className="text-zinc-500">Próximamente — set completo de 8 imágenes</p>
      </div>
    </div>
  );
}
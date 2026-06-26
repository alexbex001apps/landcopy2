"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LIBRES = ["/login", "/espera", "/reset-password", "/", "/ayuda-venezuela", "/venezuela"];

export default function Guardian({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/v/") || LIBRES.includes(pathname)) {
      setOk(true);
      return;
    }
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user;
      if (!u) { router.replace("/login"); return; }
      supabase.from("users").select("plan").eq("id", u.id).single().then(({ data }) => {
        if (!data || data.plan === "sin_acceso" || !data.plan) {
          router.replace("/espera");
        } else {
          setOk(true);
        }
      });
    });
  }, [pathname, router]);

  if (!ok) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-600 text-sm">Cargando…</p>
      </div>
    );
  }
  return <>{children}</>;
}


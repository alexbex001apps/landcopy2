"use client";
import { usePathname } from "next/navigation";

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const sinEspacio = pathname?.startsWith("/v/") || pathname?.startsWith("/ayuda-venezuela");
  return <main className={sinEspacio ? "" : "pt-16"}>{children}</main>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Venezuela necesita ayuda",
  description: "Canales verificados para donar, buscar a los tuyos y llevar ayuda. Sin rumores.",
  openGraph: {
    title: "Venezuela necesita ayuda",
    description: "Canales verificados para donar, buscar a los tuyos y llevar ayuda. Sin rumores.",
    images: ["/og-v2.png"],
    type: "website",
    url: "https://landcopy2.vercel.app/venezuela",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}





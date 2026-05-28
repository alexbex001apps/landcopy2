import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: "LandCopy 2.0",
  description: "Tu plataforma de marketing visual",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${syne.variable} ${dmSans.variable} bg-black text-white antialiased`}>
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-900 bg-black/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <a href="/" className="font-bold text-xl text-white">Land<span className="text-orange-500">Copy</span></a>
            <div className="flex items-center gap-6 text-sm text-zinc-400">
              <a href="/" className="hover:text-white transition-colors">Copy</a>
              <a href="/redes" className="hover:text-white transition-colors">Redes</a>
              <a href="/landing" className="hover:text-white transition-colors">Landing</a>
              <a href="/precios" className="hover:text-white transition-colors">Precios</a>
              <a href="/login" className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Entrar</a>
            </div>
          </div>
        </nav>
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}
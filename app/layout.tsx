import type { Metadata } from "next";
import Guardian from "@/components/Guardian";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import JosueChat from "@/components/JosueChat";

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
      <head><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&family=Montserrat:wght@400;600;800&family=Playfair+Display:wght@400;700&family=Lobster&family=Oswald:wght@400;600&family=Bebas+Neue&family=Pacifico&family=Anton&family=Dancing+Script:wght@700&family=Caveat:wght@700&family=Righteous&family=Archivo+Black&family=Fredoka:wght@600&family=Baloo+2:wght@700&family=Sora:wght@700&family=Outfit:wght@700&family=Bricolage+Grotesque:wght@700&display=swap" rel="stylesheet" /></head>
      <body className={`${syne.variable} ${dmSans.variable} bg-black text-white antialiased`}>
        <Guardian>
          <Navbar />
          <JosueChat />
          <main className="pt-16">{children}</main>
        </Guardian>
      </body>
    </html>
  );
}
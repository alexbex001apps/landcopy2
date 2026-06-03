import type { Metadata } from "next";
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
      <body className={`${syne.variable} ${dmSans.variable} bg-black text-white antialiased`}>
        <Navbar />
        <JosueChat />
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}
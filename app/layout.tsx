import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SISVENT - Sistema de Inventario",
  description: "Sistema de gestión de inventarios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`dark ${manrope.variable} h-full antialiased`}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full font-body">
        <Sidebar />
        <main className="ml-64 min-h-screen flex flex-col">
          <TopNavbar />
          {children}
        </main>
        
        {/* Floating Action Button */}
        <button className="fixed bottom-8 right-8 h-14 w-14 bg-surface-bright text-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group">
          <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform">support_agent</span>
        </button>
      </body>
    </html>
  );
}

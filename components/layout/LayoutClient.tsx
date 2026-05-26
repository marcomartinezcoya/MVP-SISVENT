'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Abre el sidebar por defecto en pantallas de escritorio
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    if (mq.matches) setSidebarOpen(true);

    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setSidebarOpen(true);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleToggle = () => setSidebarOpen(prev => !prev);
  const handleClose = () => setSidebarOpen(false);

  return (
    <>
      {/* Overlay oscuro — solo visible en mobile cuando el sidebar está abierto */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={handleClose} />

      <main
        className={`min-h-screen flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        }`}
      >
        <TopNavbar onMenuClick={handleToggle} />
        {children}
      </main>

      <button className="fixed bottom-6 right-6 md:bottom-8 md:right-8 h-12 w-12 md:h-14 md:w-14 bg-surface-bright text-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group">
        <span className="material-symbols-outlined text-2xl md:text-3xl group-hover:rotate-12 transition-transform">support_agent</span>
      </button>
    </>
  );
}

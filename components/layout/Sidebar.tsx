'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', icon: 'dashboard', label: 'Dashboard' },
  { href: '/productos', icon: 'inventory_2', label: 'Productos' },
  { href: '/proveedores', icon: 'local_shipping', label: 'Proveedores' },
  { href: '/clientes', icon: 'groups', label: 'Clientes' },
  { href: '/compras', icon: 'shopping_cart', label: 'Compras' },
  { href: '/ventas', icon: 'sell', label: 'Ventas' },
  { href: '/movimientos', icon: 'compare_arrows', label: 'Movimientos' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low flex flex-col py-6 px-4 gap-2 z-50 border-r border-outline-variant/10 shadow-xl shadow-black/20">
      <div className="px-4 mb-8">
        <h1 className="text-lg font-extrabold text-primary tracking-tight">Inventory Pro</h1>
        <p className="text-xs text-on-surface-variant uppercase tracking-widest">Enterprise Suite</p>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, icon, label }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 ${
                isActive
                  ? 'bg-surface-variant text-primary border-l-4 border-primary-dim'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant hover:translate-x-1'
              }`}
            >
              <span className="material-symbols-outlined">{icon}</span>
              <span className="font-medium text-sm">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-outline-variant/10">
        <button className="w-full flex items-center gap-3 text-on-surface-variant hover:text-error px-4 py-3 transition-all duration-200 rounded-lg hover:bg-error/5">
          <span className="material-symbols-outlined">logout</span>
          <span className="font-medium text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

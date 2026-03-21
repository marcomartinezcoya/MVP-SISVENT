import React from 'react';
import Link from 'next/link';

export function Sidebar() {
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low flex flex-col py-6 px-4 gap-2 z-50">
      <div className="px-4 mb-8">
        <h1 className="text-lg font-extrabold text-primary tracking-tight">Inventory Pro</h1>
        <p className="text-xs text-on-surface-variant uppercase tracking-widest">Enterprise Suite</p>
      </div>
      <nav className="flex-1 flex flex-col gap-1">
        <Link href="/" className="flex items-center gap-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg px-4 py-3 transition-all duration-200 hover:translate-x-1">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-medium text-sm">Dashboard</span>
        </Link>
        <Link href="/productos" className="flex items-center gap-3 bg-surface-variant text-primary rounded-lg px-4 py-3 border-l-4 border-primary-dim transition-all duration-200">
          <span className="material-symbols-outlined">inventory_2</span>
          <span className="font-medium text-sm">Productos</span>
        </Link>
        <Link href="/proveedores" className="flex items-center gap-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg px-4 py-3 transition-all duration-200 hover:translate-x-1">
          <span className="material-symbols-outlined">local_shipping</span>
          <span className="font-medium text-sm">Proveedores</span>
        </Link>
        <Link href="/clientes" className="flex items-center gap-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg px-4 py-3 transition-all duration-200 hover:translate-x-1">
          <span className="material-symbols-outlined">groups</span>
          <span className="font-medium text-sm">Clientes</span>
        </Link>
        <Link href="/compras" className="flex items-center gap-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg px-4 py-3 transition-all duration-200 hover:translate-x-1">
          <span className="material-symbols-outlined">shopping_cart</span>
          <span className="font-medium text-sm">Compras</span>
        </Link>
        <Link href="/ventas" className="flex items-center gap-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg px-4 py-3 transition-all duration-200 hover:translate-x-1">
          <span className="material-symbols-outlined">sell</span>
          <span className="font-medium text-sm">Ventas</span>
        </Link>
        <Link href="/inventario" className="flex items-center gap-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg px-4 py-3 transition-all duration-200 hover:translate-x-1">
          <span className="material-symbols-outlined">warehouse</span>
          <span className="font-medium text-sm">Inventario</span>
        </Link>
        <Link href="/movimientos" className="flex items-center gap-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg px-4 py-3 transition-all duration-200 hover:translate-x-1">
          <span className="material-symbols-outlined">compare_arrows</span>
          <span className="font-medium text-sm">Movimientos</span>
        </Link>
      </nav>
      <div className="mt-auto pt-6 border-t border-outline-variant/10">
        <button className="w-full flex items-center gap-3 text-on-surface-variant hover:text-error px-4 py-3 transition-all duration-200">
          <span className="material-symbols-outlined">logout</span>
          <span className="font-medium text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

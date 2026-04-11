import React from 'react';

export function TopNavbar() {
  return (
    <header className="w-full h-16 sticky top-0 z-40 bg-surface-container-low flex items-center justify-between px-8 border-b border-outline-variant/10">
      <div className="flex items-center gap-6">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">Sistema de Inventario</h2>
        <div className="relative hidden lg:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input 
            className="bg-surface-container-highest border-none rounded-md pl-10 pr-4 py-1.5 text-sm w-80 focus:ring-2 focus:ring-primary/50 text-on-surface placeholder:text-on-surface-variant outline-none transition-all" 
            placeholder="Buscar productos, órdenes..." 
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <button className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors">
          <span className="material-symbols-outlined">help</span>
        </button>
        <div className="h-8 w-8 rounded-full overflow-hidden bg-primary-container flex items-center justify-center ml-2 border border-outline-variant">
          <img 
            alt="Perfil de Usuario" 
            className="h-full w-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAQCPj12iWpAJOKu9IKpjlZu98voOj6du6oB14gEKRp-9dHqkALIG-Otq46txA3tEIofoqvGt-yJaw35LJavsgX7bAaOwyT9wHO2-koff4DmuCogo1f-_9U6KgRi-bNU5MZx6XE1r1YLhvfcsAmQFwI84SqFZCqm2u5aQYWE2ghKga6VAiDjJtQfmy7y8fQlXIbDo3GKIr10e0dc5yb-plQRte2OUY37H6NQYvI1DCHv93Nf4P3skOXIQV2GkndNjtx1Jrz8683hEJ"
          />
        </div>
      </div>
    </header>
  );
}

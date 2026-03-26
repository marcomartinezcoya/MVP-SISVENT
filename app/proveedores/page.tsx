'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Proveedor,
  ProveedorCreateInput,
  ProveedorUpdateInput,
  CATEGORIAS_PROVEEDOR,
  CategoriaProveedor,
  CATEGORIA_STYLES,
  MOCK_PROVEEDORES,
  MOCK_STATS,
} from '@/lib/types/proveedor';
import { ProveedorFormModal } from '@/components/modules/proveedores/ProveedorFormModal';

// ── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// ── Top Supplier Cards ─────────────────────────────────────────────────────

function SupplierHighlightCards({ proveedores }: { proveedores: Proveedor[] }) {
  const top3 = proveedores
    .filter((p) => p.estado === 'activo')
    .sort((a, b) => (b.calificacion ?? 0) - (a.calificacion ?? 0))
    .slice(0, 3);

  const cardAccents = [
    { icon: 'precision_manufacturing', color: 'text-primary', bg: 'bg-primary/10', dot: 'border-t-2 border-primary/30' },
    { icon: 'category', color: 'text-secondary', bg: 'bg-secondary/10', dot: 'border-t-2 border-secondary/30' },
    { icon: 'electric_bolt', color: 'text-tertiary', bg: 'bg-tertiary/10', dot: 'border-t-2 border-tertiary/30' },
  ];

  if (top3.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      {top3.map((prov, idx) => {
        const accent = cardAccents[idx];
        const style = CATEGORIA_STYLES[prov.categoria];
        return (
          <div
            key={prov.id}
            className={`bg-surface-container rounded-xl p-6 relative overflow-hidden group hover:bg-surface-container-high transition-colors ${accent.dot}`}
          >
            {/* Background icon */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
              <span
                className={`material-symbols-outlined text-6xl ${accent.color}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_shipping
              </span>
            </div>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-lg ${accent.bg} flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined ${accent.color} text-3xl`}>
                  {accent.icon}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base text-on-surface truncate">{prov.nombre}</h3>
                <span className={`text-xs font-black uppercase tracking-widest ${accent.color}`}>
                  {prov.categoria}
                </span>
              </div>
            </div>

            {/* Stats mini-grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-3 rounded-lg">
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant mb-1 font-medium">
                  Calificación
                </p>
                <p className="text-xl font-black text-tertiary-fixed-dim">{prov.calificacion ?? '--'}%</p>
              </div>
              <div className="bg-surface-container-low p-3 rounded-lg">
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant mb-1 font-medium">
                  Pedidos Activos
                </p>
                <p className="text-xl font-black text-secondary">
                  {String(prov.pedidos_activos ?? 0).padStart(2, '0')}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>(MOCK_PROVEEDORES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<'Todos' | CategoriaProveedor>('Todos');

  const [page, setPage] = useState(1);
  const limit = 10;
  
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeSearch, setActiveSearch] = useState('');

  // ── Derived data ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...proveedores];

    if (activeSearch) {
      const q = activeSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.ruc.includes(q) ||
          p.contacto.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q),
      );
    }

    if (categoriaFilter !== 'Todos') {
      list = list.filter((p) => p.categoria === categoriaFilter);
    }

    list.sort((a, b) => a.nombre.localeCompare(b.nombre));

    return list;
  }, [proveedores, activeSearch, categoriaFilter]);

  const totalPages = Math.ceil(filtered.length / limit);
  const fromItem = filtered.length === 0 ? 0 : (page - 1) * limit + 1;
  const toItem = Math.min(page * limit, filtered.length);

  const paginatedProveedores = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      setActiveSearch(value);
    }, 350);
  };

  const handleCategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPage(1);
    setCategoriaFilter(e.target.value as 'Todos' | CategoriaProveedor);
  };

  const handleOpenNew = () => {
    setSelectedProveedor(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Proveedor) => {
    setSelectedProveedor(p);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (id: string) => {
    setProveedores((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, estado: p.estado === 'activo' ? 'inactivo' : 'activo' }
          : p,
      ),
    );
  };

  // Mock save — replace with real server action when ready
  const handleSave = async (
    data: ProveedorCreateInput | ProveedorUpdateInput,
    mode: 'create' | 'edit',
  ): Promise<{ success: boolean; error?: string }> => {
    if (mode === 'edit' && selectedProveedor) {
      setProveedores((prev) =>
        prev.map((p) =>
          p.id === selectedProveedor.id ? { ...p, ...(data as ProveedorUpdateInput) } : p,
        ),
      );
    } else {
      const newProveedor: Proveedor = {
        id: String(Date.now()),
        ...(data as ProveedorCreateInput),
        calificacion: 100,
        pedidos_activos: 0,
        created_at: new Date().toISOString(),
      };
      setProveedores((prev) => [newProveedor, ...prev]);
      setPage(1); // Go to first page to see new item
    }
    return { success: true };
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="p-8 space-y-0">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-1">
            Directorio de Proveedores
          </h2>
          <p className="text-on-surface-variant font-medium">
            Gestiona y optimiza tu cadena de suministro.
          </p>
        </div>
        <button
          id="btn-nuevo-proveedor"
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary-dim to-primary text-on-primary-container font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            add
          </span>
          Añadir Proveedor
        </button>
      </div>

      {/* ── Top Supplier Highlight Cards ──────────────────────────────── */}
      <SupplierHighlightCards proveedores={proveedores} />

      {/* ── Filters & Table Section ───────────────────────────────────── */}
      <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10 shadow-2xl shadow-black/40">
        {/* Table Controls (similar to productos) */}
        <div className="p-6 flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              className="w-full bg-surface-container border border-outline-variant/20 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none"
              placeholder="Buscar por nombre, RUC o email..."
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
            />
          </div>
          <select
            className="bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/40 transition-all outline-none appearance-none cursor-pointer"
            onChange={handleCategoriaChange}
            value={categoriaFilter}
          >
            <option value="Todos">Categoría: Todas</option>
            {CATEGORIAS_PROVEEDOR.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant font-medium">
            Mostrar {fromItem}-{toItem} de {filtered.length}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 bg-surface-container-highest rounded-md text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button
              disabled={page >= totalPages || totalPages === 0}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 bg-surface-container-highest rounded-md text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

        {/* ── Table ─────────────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-high/50 border-b border-outline-variant/10">
                <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant">
                  Nombre del Proveedor
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant">
                  RUC
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant">
                  Persona de Contacto
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant">
                  Categoría
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant">
                  Teléfono y Email
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant">
                  Estado
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {paginatedProveedores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                      <span className="material-symbols-outlined text-5xl opacity-30">
                        local_shipping
                      </span>
                      <p className="font-semibold">No se encontraron proveedores</p>
                      <p className="text-xs">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProveedores.map((prov) => {
                  const style = CATEGORIA_STYLES[prov.categoria];
                  const initials = getInitials(prov.nombre);
                  const isActivo = prov.estado === 'activo';

                  return (
                    <tr
                      key={prov.id}
                      className="hover:bg-surface-container transition-colors group"
                    >
                      {/* Nombre */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center text-xs font-black border border-outline-variant/20 shrink-0 ${style.avatarText}`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                              {prov.nombre}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* RUC */}
                      <td className="px-6 py-5">
                        <span className="text-xs font-mono text-on-surface-variant bg-surface-container px-2 py-1 rounded">
                          {prov.ruc}
                        </span>
                      </td>

                      {/* Contacto */}
                      <td className="px-6 py-5 text-sm font-medium text-on-surface-variant">
                        {prov.contacto}
                      </td>

                      {/* Categoría Badge */}
                      <td className="px-6 py-5">
                        <span
                          className={`${style.bg} ${style.text} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap`}
                        >
                          {prov.categoria}
                        </span>
                      </td>

                      {/* Teléfono y Email */}
                      <td className="px-6 py-5">
                        <div className="text-xs space-y-0.5">
                          <p className="text-on-surface font-medium">{prov.telefono}</p>
                          <p className="text-on-surface-variant">{prov.email}</p>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isActivo
                                ? 'bg-tertiary-fixed-dim shadow-[0_0_8px_rgba(84,238,216,0.5)]'
                                : 'bg-error shadow-[0_0_8px_rgba(255,113,108,0.4)]'
                            }`}
                          />
                          <span
                            className={`text-xs font-bold ${
                              isActivo ? 'text-tertiary-fixed-dim' : 'text-error'
                            }`}
                          >
                            {isActivo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEdit(prov)}
                            className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg text-on-surface-variant transition-all"
                            title="Editar proveedor"
                          >
                            <span className="material-symbols-outlined text-xl">edit</span>
                          </button>
                          <button
                            onClick={() => handleToggleStatus(prov.id)}
                            className={`p-2 rounded-lg text-on-surface-variant transition-all ${
                              isActivo
                                ? 'hover:bg-error/10 hover:text-error'
                                : 'hover:bg-tertiary/10 hover:text-tertiary'
                            }`}
                            title={isActivo ? 'Desactivar proveedor' : 'Activar proveedor'}
                          >
                            <span className="material-symbols-outlined text-xl">
                              {isActivo ? 'block' : 'check_circle'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer ──────────────────────────────────────────── */}
        <div className="px-6 py-4 bg-surface-container-high/30 flex items-center justify-between border-t border-outline-variant/10">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Activo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-error"></span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Inactivo</span>
            </div>
          </div>
          <div className="text-xs text-on-surface-variant italic">
            {filtered.length} proveedores encontrados
          </div>
        </div>
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────── */}
      <ProveedorFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        proveedor={selectedProveedor}
        onSave={handleSave}
      />
    </div>
  );
}

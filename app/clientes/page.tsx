'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  ClienteDB,
  ClienteCreateInput,
  ClienteUpdateInput,
  getNombreCliente,
  getInicialesCliente,
} from '@/lib/types/cliente';
import { ClienteFormModal } from '@/components/modules/clientes/ClienteFormModal';
import {
  getClientes,
  getClientesStats,
  createCliente,
  updateCliente,
  loadMoreClientes,
} from '@/app/clientes/actions';

// ══════════════════════════════════════════════════════════════════
//  Constants
// ══════════════════════════════════════════════════════════════════

const PAGE_SIZE = 6;

// ══════════════════════════════════════════════════════════════════
//  Skeleton card
// ══════════════════════════════════════════════════════════════════

function SkeletonCard() {
  return (
    <div className="rounded-xl p-6 bg-surface-container-low border border-outline-variant/10 animate-pulse space-y-4">
      <div className="flex gap-4 items-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-container-highest" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-surface-container-highest rounded w-3/4" />
          <div className="h-3 bg-surface-container-highest rounded w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-14 bg-surface-container-highest rounded-xl" />
        <div className="h-14 bg-surface-container-highest rounded-xl" />
      </div>
      <div className="h-8 bg-surface-container-highest rounded-xl" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Cliente Card
// ══════════════════════════════════════════════════════════════════

interface ClienteCardProps {
  cliente: ClienteDB;
  onEdit: (c: ClienteDB) => void;
}

function ClienteCard({ cliente, onEdit }: ClienteCardProps) {
  const nombre = getNombreCliente(cliente);
  const iniciales = getInicialesCliente(cliente);

  // Mocks variables to match visual reference (since DB fields are not actually present in `clientes` table)
  // Determine categories deterministically based on ID to keep it consistent
  const idNum = cliente.id.charCodeAt(0) + cliente.id.charCodeAt(cliente.id.length - 1);
  const categorias = ['VIP', 'REGULAR', 'NUEVO'];
  const categoria = categorias[idNum % 3];
  
  const pedidosTotales = idNum % 150 + 1;
  const valorVida = (pedidosTotales * 45).toLocaleString('en-US');
  const dias = (idNum % 20) + 1;
  const ultimaCompra = dias === 1 ? 'Ayer' : `${dias} oct 2023`;

  let tagClass = '';
  let accentColor = '';
  if (categoria === 'VIP') {
    tagClass = 'bg-primary-container/20 text-primary border-primary/20';
    accentColor = 'primary';
  } else if (categoria === 'REGULAR') {
    tagClass = 'bg-secondary-container/10 text-secondary border-secondary/20';
    accentColor = 'secondary';
  } else {
    tagClass = 'bg-tertiary-container/10 text-tertiary border-tertiary/20';
    accentColor = 'tertiary';
  }

  // Si está inactivo, bajamos la opacidad general de la card y forzamos indicador
  const opacityClass = cliente.estado ? '' : 'opacity-60 saturate-50';

  return (
    <div
      className={`rounded-xl p-6 bg-surface-container-low border border-outline-variant/10 shadow-xl shadow-black/20 transition-all group hover:border-${accentColor}/30 hover:shadow-${accentColor}/5 ${opacityClass}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4">
          {/* Avatar */}
          {cliente.foto_url ? (
            <div className={`relative w-14 h-14 shrink-0 rounded-2xl overflow-hidden ring-2 ring-${accentColor}/20`}>
              <Image
                src={cliente.foto_url}
                alt={`Foto de ${nombre}`}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
          ) : (
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border ring-2 bg-${accentColor}/10 text-${accentColor} border-${accentColor}/20 ring-${accentColor}/5 shrink-0`}
            >
              {iniciales}
            </div>
          )}

          <div>
            <h3
              className={`font-bold text-lg text-on-surface transition-colors group-hover:text-${accentColor} line-clamp-1`}
              title={nombre}
            >
              {nombre}
            </h3>
            <p className="text-xs text-on-surface-variant font-medium line-clamp-1" title={cliente.tipo_cliente === 'empresa' ? cliente.razon_social || 'Empresa' : 'Persona Natural'}>
              {cliente.tipo_cliente === 'empresa' ? cliente.razon_social || 'Empresa' : 'Persona Natural'}
              {!cliente.estado && ' (Inactivo)'}
            </p>
          </div>
        </div>

        {/* Tag badge */}
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${tagClass}`}
        >
          {categoria}
        </span>
      </div>

      {/* Info grid (Pedidos & LTV) */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-surface-container-highest p-3 rounded-xl">
          <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
            Pedidos Totales
          </p>
          <p className="text-xl font-bold text-on-surface mt-0.5">{pedidosTotales}</p>
        </div>
        <div className="bg-surface-container-highest p-3 rounded-xl">
          <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
            Valor de Vida
          </p>
          <p className="text-xl font-bold text-tertiary mt-0.5">${valorVida}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-outline-variant/10 pt-4">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
          <span className="material-symbols-outlined text-sm">calendar_today</span>
          Última compra: <span className="text-on-surface">{ultimaCompra}</span>
        </div>
        <button
          onClick={() => onEdit(cliente)}
          className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors"
          title="Ver Detalles"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Page
// ══════════════════════════════════════════════════════════════════

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteDB[]>([]);
  const [total, setTotal] = useState(0);
  const [clientesActivos, setClientesActivos] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteDB | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Guard to prevent double-fetch on mount (debounce fires after initial load)
  const didMount = useRef(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch list only (no stats) ────────────────────────────────────
  const fetchList = useCallback(async (searchTerm: string) => {
    setIsLoading(true);
    try {
      const result = await getClientes({ page: 1, limit: PAGE_SIZE, search: searchTerm });
      if (!result.error) {
        setClientes(result.data.data);
        setTotal(result.data.total);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Initial load (list + stats in parallel) ──────────────────────
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const [listResult, statsResult] = await Promise.all([
        getClientes({ page: 1, limit: PAGE_SIZE, search: '' }),
        getClientesStats(),
      ]);
      if (!listResult.error) {
        setClientes(listResult.data.data);
        setTotal(listResult.data.total);
      }
      if (!statsResult.error) {
        setClientesActivos(statsResult.data.activos);
      }
      setIsLoading(false);
      didMount.current = true;
    }
    init();
  }, []);

  // ── Debounced search (skips on first mount) ──────────────────────
  useEffect(() => {
    // Skip the first fire — initial load already fetched
    if (!didMount.current) return;

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(searchInput);
      fetchList(searchInput);
    }, 350);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // ── Load more ────────────────────────────────────────────────────
  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const result = await loadMoreClientes(clientes.length, PAGE_SIZE, search);
      if (!result.error) {
        setClientes(prev => [...prev, ...result.data]);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  // ── Modal handlers ───────────────────────────────────────────────
  const handleOpenNew = () => {
    setSelectedCliente(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: ClienteDB) => {
    setSelectedCliente(c);
    setIsModalOpen(true);
  };

  // ── Save handler (called by modal) ───────────────────────────────
  const handleSave = async (
    data: ClienteCreateInput | ClienteUpdateInput,
    mode: 'create' | 'edit',
  ): Promise<{ success: boolean; error?: string }> => {
    let result;
    if (mode === 'create') {
      result = await createCliente(data as ClienteCreateInput);
    } else {
      result = await updateCliente(selectedCliente!.id, data as ClienteUpdateInput);
    }

    if (result.error) return { success: false, error: result.error };

    // Refresh list + stats after CRUD
    const [listResult, statsResult] = await Promise.all([
      getClientes({ page: 1, limit: PAGE_SIZE, search }),
      getClientesStats(),
    ]);
    if (!listResult.error) {
      setClientes(listResult.data.data);
      setTotal(listResult.data.total);
    }
    if (!statsResult.error) {
      setClientesActivos(statsResult.data.activos);
    }
    return { success: true };
  };

  const hasMore = clientes.length < total;
  const showSkeletons = isLoading;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-300">

      {/* ── Header + KPI ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Clientes</h2>
          <p className="text-on-surface-variant max-w-md">
            Administra las relaciones con tus clientes y su información de contacto.
          </p>
        </div>

        {/* KPI: Clientes Activos */}
        <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10 flex flex-col gap-4 relative overflow-hidden group">
          <div className="flex items-center justify-between z-10">
            <span className="text-on-surface-variant font-semibold text-sm uppercase tracking-wider">
              Clientes Activos
            </span>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                groups
              </span>
            </div>
          </div>
          <div className="z-10">
            {clientesActivos === null ? (
              <div className="h-10 w-20 bg-surface-container-highest rounded animate-pulse" />
            ) : (
              <p className="text-4xl font-extrabold text-on-surface tracking-tighter">
                {clientesActivos.toLocaleString('es-PE')}
              </p>
            )}
            <p className="text-xs text-tertiary-fixed-dim mt-1 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">groups</span>
              Clientes con estado activo
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
        </div>
      </div>

      {/* ── Filters & Actions ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            className="w-full bg-surface-container border border-outline-variant/20 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none"
            placeholder="Buscar por nombre, documento o email..."
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary-dim to-primary text-on-primary-container font-bold rounded-md shadow-lg shadow-primary/20 active:scale-95 transition-all w-full md:w-auto"
        >
          <span className="material-symbols-outlined text-xl">person_add</span>
          Nuevo Cliente
        </button>
      </div>

      {/* ── Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {showSkeletons
          ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)
          : clientes.map(c => (
              <ClienteCard key={c.id} cliente={c} onEdit={handleOpenEdit} />
            ))}
      </div>

      {/* ── Empty state ───────────────────────────────────────────── */}
      {!showSkeletons && clientes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant gap-4 bg-surface-container-low rounded-xl border border-outline-variant/10">
          <span className="material-symbols-outlined text-5xl opacity-40">group_off</span>
          <p className="font-medium">
            {search ? `Sin resultados para "${search}"` : 'No hay clientes registrados'}
          </p>
          {!search && (
            <button
              onClick={handleOpenNew}
              className="flex items-center gap-2 px-5 py-2 bg-primary/10 text-primary rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              Añadir primer cliente
            </button>
          )}
        </div>
      )}

      {/* ── Load More ─────────────────────────────────────────────── */}
      {!showSkeletons && hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-on-surface-variant hover:text-on-surface hover:border-primary/30 hover:bg-surface-container transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                Cargando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">expand_more</span>
                Ver más clientes
                <span className="text-xs text-on-surface-variant/60 ml-1">
                  ({clientes.length} / {total})
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Total counter ─────────────────────────────────────────── */}
      {!showSkeletons && clientes.length > 0 && (
        <p className="text-center text-xs text-on-surface-variant/60">
          Mostrando {clientes.length} de {total} clientes
          {search && ` · Filtrado por "${search}"`}
        </p>
      )}

      {/* ── Modal ─────────────────────────────────────────────────── */}
      <ClienteFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cliente={selectedCliente}
        onSave={handleSave}
      />
    </div>
  );
}

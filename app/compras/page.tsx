'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CompraDB,
  ComprasDashboardStats,
  getEstadoCompraStyle,
  getEstadoLabel,
  getProveedorInitialStyle,
  getProveedorInitials,
  formatSoles,
} from '@/lib/types/compra';
import { CompraModal } from '@/components/modules/compras/CompraModal';
import {
  getCompras,
  getComprasDashboardStats,
} from '@/app/compras/actions';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(isoDate: string): string {
  if (!isoDate) return '—';
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Dashboard Stats Cards ─────────────────────────────────────────────────────

function StatsCards({ stats, loading }: { stats: ComprasDashboardStats; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="md:col-span-2 bg-surface-container-low p-6 rounded-lg animate-pulse">
          <div className="h-4 w-48 bg-surface-variant rounded mb-4" />
          <div className="h-10 w-40 bg-surface-variant rounded" />
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="bg-surface-container p-6 rounded-lg animate-pulse">
            <div className="h-8 w-8 bg-surface-variant rounded-lg mb-4" />
            <div className="h-8 w-16 bg-surface-variant rounded mb-2" />
            <div className="h-3 w-32 bg-surface-variant rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
      {/* Featured Card: Total Pending */}
      <div className="md:col-span-2 bg-surface-container-low p-6 rounded-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: '"FILL" 1' }}>payments</span>
        </div>
        <div className="relative z-10">
          <p className="text-on-surface-variant text-sm font-medium mb-1">Valor Total de Pedidos Pendientes</p>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-on-surface">{formatSoles(stats.valorPendientes)}</span>
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-1 flex-1 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: stats.valorPendientes > 0 ? '65%' : '0%' }} />
            </div>
          </div>
          <p className="text-[10px] text-on-surface-variant mt-2 uppercase tracking-widest font-bold">
            {stats.countPendientes} orden{stats.countPendientes !== 1 ? 'es' : ''} pendiente{stats.countPendientes !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Stats Card 1: Pendientes */}
      <div className="bg-surface-container p-6 rounded-lg flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-primary/10 rounded-lg">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>pending_actions</span>
          </div>
          <span className="text-xs text-on-surface-variant">Activas</span>
        </div>
        <div>
          <p className="text-2xl font-bold mt-4 text-on-surface">{stats.countPendientes}</p>
          <p className="text-xs text-on-surface-variant uppercase font-bold tracking-tighter">Pendientes de Aprobación</p>
        </div>
      </div>

      {/* Stats Card 2: Esperados hoy */}
      <div className="bg-surface-container p-6 rounded-lg flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-tertiary/10 rounded-lg">
            <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: '"FILL" 1' }}>local_shipping</span>
          </div>
          <span className="text-xs text-on-surface-variant">Hoy</span>
        </div>
        <div>
          <p className="text-2xl font-bold mt-4 text-on-surface">{stats.esperadosHoy}</p>
          <p className="text-xs text-on-surface-variant uppercase font-bold tracking-tighter">Esperados para Hoy</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ComprasPage() {
  // ── Data state
  const [compras, setCompras] = useState<CompraDB[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ComprasDashboardStats>({
    valorPendientes: 0,
    countPendientes: 0,
    esperadosHoy: 0,
  });

  // ── Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedCompra, setSelectedCompra] = useState<CompraDB | null>(null);

  // ── Filter state
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived pagination
  const totalPages = Math.ceil(total / limit);
  const fromItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const toItem = Math.min(page * limit, total);

  // ── Fetch helpers
  const fetchCompras = useCallback(async (p: number, search: string, estado: string, fInicio: string, fFin: string) => {
    setLoading(true);
    setError(null);
    const result = await getCompras({ page: p, limit, search, estado, fechaInicio: fInicio, fechaFin: fFin });
    if (result.error) {
      setError(result.error);
    } else {
      setCompras(result.data.data);
      setTotal(result.data.total);
    }
    setLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    const result = await getComprasDashboardStats();
    if (!result.error) setStats(result.data);
    setStatsLoading(false);
  }, []);

  // ── Initial load (parallelized)
  useEffect(() => {
    async function init() {
      const [comprasResult, statsResult] = await Promise.all([
        getCompras({ page: 1, limit, search: '', estado: '', fechaInicio: '', fechaFin: '' }),
        getComprasDashboardStats(),
      ]);
      if (!comprasResult.error) {
        setCompras(comprasResult.data.data);
        setTotal(comprasResult.data.total);
      }
      if (!statsResult.error) setStats(statsResult.data);
      setLoading(false);
      setStatsLoading(false);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEstadoFilter(e.target.value);
  };

  const handleFechaInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFechaInicio(e.target.value);
  };

  const handleFechaFinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFechaFin(e.target.value);
  };

  const executeSearch = () => {
    setPage(1);
    setActiveSearch(searchInput);
    fetchCompras(1, searchInput, estadoFilter, fechaInicio, fechaFin);
  };

  const handleLimpiarFechas = () => {
    setFechaInicio('');
    setFechaFin('');
    setEstadoFilter('');
    setSearchInput('');
    setActiveSearch('');
    setPage(1);
    fetchCompras(1, '', '', '', '');
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchCompras(newPage, activeSearch, estadoFilter, fechaInicio, fechaFin);
  };

  const handleOpenNew = () => {
    setModalMode('create');
    setSelectedCompra(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (compra: CompraDB) => {
    setModalMode('edit');
    setSelectedCompra(compra);
    setIsModalOpen(true);
  };

  const handleOpenView = (compra: CompraDB) => {
    setModalMode('view');
    setSelectedCompra(compra);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleSaved = async () => {
    // Refresh both table and stats in parallel after any save
    await Promise.all([
      fetchCompras(modalMode === 'create' ? 1 : page, activeSearch, estadoFilter, fechaInicio, fechaFin),
      fetchStats(),
    ]);
    if (modalMode === 'create') setPage(1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
            <span>Compras</span>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-primary font-medium">Gestión de Pedidos</span>
          </nav>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Órdenes de Compra</h2>
        </div>
        <button
          onClick={handleOpenNew}
          className="bg-primary-container text-on-primary-container px-6 py-3 rounded-md font-bold flex items-center gap-2 active:scale-95 transition-transform shadow-lg shadow-primary/10"
        >
          <span className="material-symbols-outlined shrink-0">add</span>
          Crear Nueva Orden de Compra
        </button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} loading={statsLoading} />

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-error/10 border border-error/30 rounded-lg text-sm text-error">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant/10 shadow-2xl shadow-black/40">

        {/* Table Controls */}
        <div className="p-6 border-b border-outline-variant/10 mb-4 bg-surface-container-low">
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              
              {/* Buscador de orden */}
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                <input
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none"
                  placeholder="Buscar por Nº de orden..."
                  type="text"
                  value={searchInput}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
                />
              </div>

              {/* Selector de estado */}
              <select
                className="bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/40 transition-all outline-none appearance-none cursor-pointer"
                onChange={handleEstadoChange}
                value={estadoFilter}
              >
                <option value="">Estado: Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="recibido">Recibido</option>
                <option value="cancelado">Cancelado</option>
              </select>

              {/* Filtro de Fechas */}
              <div className="flex items-center gap-2 ml-1">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">calendar_today</span>
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant whitespace-nowrap">Emisión</span>
              </div>
              
              <div className="flex items-center gap-2 bg-surface-container border border-outline-variant/20 rounded-lg px-3 py-2 h-[38px] focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all box-border">
                <span className="text-xs font-medium text-on-surface-variant shrink-0">Desde:</span>
                <input
                  type="date"
                  className="bg-transparent border-none text-sm text-on-surface outline-none cursor-pointer p-0 h-full"
                  style={{ colorScheme: 'dark' }}
                  value={fechaInicio}
                  onChange={handleFechaInicioChange}
                  title="Fecha inicio"
                />
              </div>
              <span className="text-on-surface-variant text-xs font-bold">—</span>
              <div className="flex items-center gap-2 bg-surface-container border border-outline-variant/20 rounded-lg px-3 py-2 h-[38px] focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all box-border">
                <span className="text-xs font-medium text-on-surface-variant shrink-0">Hasta:</span>
                <input
                  type="date"
                  className="bg-transparent border-none text-sm text-on-surface outline-none cursor-pointer p-0 h-full"
                  style={{ colorScheme: 'dark' }}
                  value={fechaFin}
                  onChange={handleFechaFinChange}
                  title="Fecha fin"
                />
              </div>

              {/* Acciones */}
              <button
                onClick={executeSearch}
                className="flex items-center gap-1.5 ml-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-bold transition-all text-sm shadow-sm"
                title="Ejecutar búsqueda"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                Buscar
              </button>

              {(fechaInicio || fechaFin || estadoFilter || searchInput) && (
                <button
                  onClick={handleLimpiarFechas}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all border border-transparent hover:border-error/20"
                  title="Limpiar todos los filtros"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  Limpiar
                </button>
              )}
            </div>

            {/* Pagination info and controls */}
            <div className="flex items-center gap-3 shrink-0 ml-auto w-full xl:w-auto justify-between xl:justify-end border-t border-outline-variant/10 xl:border-t-0 pt-4 xl:pt-0 mt-4 xl:mt-0">
              <span className="text-xs text-on-surface-variant font-medium">
                {total === 0 ? 'Sin resultados' : `Mostrando ${fromItem}-${toItem} de ${total}`}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1 || loading}
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  className="p-1.5 bg-surface-container-highest rounded-md text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <button
                  disabled={page >= totalPages || totalPages === 0 || loading}
                  onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                  className="p-1.5 bg-surface-container-highest rounded-md text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="grid grid-cols-6 px-8 py-4 bg-surface-container-high/30 text-[10px] uppercase tracking-widest font-black text-on-surface-variant border-b border-outline-variant/10">
              <div className="col-span-1">Nº de Orden</div>
              <div className="col-span-1">Proveedor</div>
              <div className="col-span-1">Fecha de Emisión</div>
              <div className="col-span-1">Monto</div>
              <div className="col-span-1">Estado</div>
              <div className="col-span-1 text-right">Acciones</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-outline-variant/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-6 px-8 py-5 animate-pulse items-center">
                    <div className="h-4 w-28 bg-surface-variant rounded" />
                    <div className="flex items-center gap-3 col-span-1">
                      <div className="w-8 h-8 rounded-lg bg-surface-variant shrink-0" />
                      <div className="h-4 w-24 bg-surface-variant rounded" />
                    </div>
                    <div className="h-4 w-20 bg-surface-variant rounded" />
                    <div className="h-4 w-24 bg-surface-variant rounded" />
                    <div className="h-5 w-20 bg-surface-variant rounded-full" />
                    <div className="flex justify-end gap-1">
                      <div className="h-8 w-8 bg-surface-variant rounded-lg" />
                      <div className="h-8 w-8 bg-surface-variant rounded-lg" />
                    </div>
                  </div>
                ))
              ) : compras.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl opacity-30">receipt_long</span>
                    <p className="font-semibold">No se encontraron órdenes</p>
                    <p className="text-xs">Usa el botón &quot;Crear Nueva Orden&quot; para empezar</p>
                  </div>
                </div>
              ) : (
                compras.map((compra, i) => {
                  const style = getEstadoCompraStyle(compra.estado);
                  const providerStyle = getProveedorInitialStyle(i);
                  const proveedorNombre = compra.proveedores?.nombre ?? '—';
                  const initials = getProveedorInitials(proveedorNombre);

                  return (
                    <div key={compra.id} className="grid grid-cols-6 px-8 py-5 items-center hover:bg-surface-container/50 transition-colors group">

                      <div className="col-span-1">
                        <span className="font-bold text-on-surface group-hover:text-primary transition-colors">
                          {compra.numero_orden}
                        </span>
                      </div>

                      <div className="col-span-1 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${providerStyle.bg} flex items-center justify-center text-xs font-bold ${providerStyle.text} border border-outline-variant/20 shrink-0`}>
                          {initials}
                        </div>
                        <span className="text-sm font-bold text-on-surface truncate pr-2">
                          {proveedorNombre}
                        </span>
                      </div>

                      <div className="col-span-1 text-sm text-on-surface-variant font-medium">
                        {formatFecha(compra.fecha_emision)}
                      </div>

                      <div className="col-span-1 font-extrabold text-on-surface">
                        {formatSoles(Number(compra.total))}
                      </div>

                      <div className="col-span-1">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${style.bg} ${style.text}`}>
                          {getEstadoLabel(compra.estado)}
                        </span>
                      </div>

                      <div className="col-span-1 text-right">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1">
                          <button
                            className="p-2 hover:bg-surface-variant rounded-lg text-on-surface-variant transition-colors"
                            title="Ver detalles"
                            onClick={() => handleOpenView(compra)}
                          >
                            <span className="material-symbols-outlined text-xl">visibility</span>
                          </button>
                          {compra.estado !== 'recibido' && compra.estado !== 'cancelado' && (
                            <button
                              className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg text-on-surface-variant transition-colors"
                              title="Editar"
                              onClick={() => handleOpenEdit(compra)}
                            >
                              <span className="material-symbols-outlined text-xl">edit</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Table Footer */}
        <div className="px-8 py-6 flex items-center justify-between border-t border-outline-variant/10 bg-surface-container-high/30">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary/40" />
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Pendientes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tertiary/40" />
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Recibidos</span>
            </div>
          </div>
          <span className="text-xs text-on-surface-variant italic">
            {total} compras encontradas
          </span>
        </div>
      </div>

      {/* Modal */}
      <CompraModal
        isOpen={isModalOpen}
        onClose={handleClose}
        mode={modalMode}
        compra={selectedCompra}
        onSaved={handleSaved}
      />
    </div>
  );
}

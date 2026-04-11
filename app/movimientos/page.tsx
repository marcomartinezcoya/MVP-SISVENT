'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { EntradaModal } from '@/components/modules/movimientos/EntradaModal';
import {
  MovimientoDB,
  MovimientosStats,
  MovimientoHistoricoItem,
  DistribucionTipo,
  TipoMovimiento,
  getTipoMovimientoStyle,
  getTipoMovimientoLabel,
  formatCantidad,
} from '@/lib/types/movimiento';
import {
  getMovimientos,
  getMovimientosStats,
  getMovimientosHistorico,
  getDistribucionMovimientos,
  deleteMovimiento,
} from '@/app/movimientos/actions';

// ── Helper: format date ───────────────────────────────────────────────────────

function formatFecha(iso: string): { date: string; time: string } {
  try {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  } catch {
    return { date: iso, time: '' };
  }
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MovimientosPage() {
  // ── Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── List state
  const [movimientos, setMovimientos] = useState<MovimientoDB[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  // ── Filters
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // ── Dashboard data
  const [stats, setStats] = useState<MovimientosStats>({ totalMovimientos: 0, entradasHoy: 0, salidasHoy: 0 });
  const [historico, setHistorico] = useState<MovimientoHistoricoItem[]>([]);
  const [distribucion, setDistribucion] = useState<DistribucionTipo[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Derived pagination
  const totalPages = Math.ceil(total / limit);
  const fromItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const toItem = Math.min(page * limit, total);

  // ── Fetch helpers
  const fetchMovimientos = useCallback(
    async (p: number, search: string, tipo: string, fInicio: string, fFin: string) => {
      setTableLoading(true);
      const result = await getMovimientos({ page: p, limit, search, tipo, fechaInicio: fInicio, fechaFin: fFin });
      if (!result.error) {
        setMovimientos(result.data.data);
        setTotal(result.data.total);
      }
      setTableLoading(false);
    },
    [],
  );

  const fetchDashboard = useCallback(async () => {
    const [statsResult, historicoResult, distResult] = await Promise.all([
      getMovimientosStats(),
      getMovimientosHistorico(),
      getDistribucionMovimientos(),
    ]);
    if (!statsResult.error) setStats(statsResult.data);
    if (!historicoResult.error) setHistorico(historicoResult.data);
    if (!distResult.error) setDistribucion(distResult.data);
    setStatsLoading(false);
  }, []);

  // ── Initial load
  useEffect(() => {
    async function init() {
      const [movResult, statsResult, historicoResult, distResult] = await Promise.all([
        getMovimientos({ page: 1, limit, search: '', tipo: '', fechaInicio: '', fechaFin: '' }),
        getMovimientosStats(),
        getMovimientosHistorico(),
        getDistribucionMovimientos(),
      ]);
      if (!movResult.error) {
        setMovimientos(movResult.data.data);
        setTotal(movResult.data.total);
      }
      if (!statsResult.error) setStats(statsResult.data);
      if (!historicoResult.error) setHistorico(historicoResult.data);
      if (!distResult.error) setDistribucion(distResult.data);
      setInitialLoading(false);
      setStatsLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers
  const executeSearch = () => {
    setPage(1);
    setActiveSearch(searchInput);
    fetchMovimientos(1, searchInput, tipoFilter, fechaInicio, fechaFin);
  };

  const handleLimpiar = () => {
    setSearchInput(''); setActiveSearch(''); setTipoFilter(''); setFechaInicio(''); setFechaFin(''); setPage(1);
    fetchMovimientos(1, '', '', '', '');
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchMovimientos(newPage, activeSearch, tipoFilter, fechaInicio, fechaFin);
  };

  const handleSaved = async () => {
    await Promise.all([
      fetchMovimientos(1, activeSearch, tipoFilter, fechaInicio, fechaFin),
      fetchDashboard(),
    ]);
    setPage(1);
  };

  const handleDelete = async (mov: MovimientoDB) => {
    if (!confirm(`¿Eliminar el movimiento ${mov.codigo_movimiento}?`)) return;
    const result = await deleteMovimiento(mov.id);
    if (result.error) alert(result.error);
    else {
      fetchMovimientos(page, activeSearch, tipoFilter, fechaInicio, fechaFin);
      fetchDashboard();
    }
  };

  // ── Chart calculations
  const maxHistorico = Math.max(...historico.map((h) => h.total), 1);

  // ── Export PDF
  const handleExportPDF = async () => {
    const jsPDFModule = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    const jsPDF = jsPDFModule.default;
    const autoTable = autoTableModule.default;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(30, 30, 38);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setFontSize(20); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text('SISVENT', 14, 20);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 180, 200);
    doc.text('Reporte de Movimientos de Inventario', 14, 28);
    doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 14, 34);
    doc.setFontSize(11); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text('INVENTARIO', pageWidth - 14, 20, { align: 'right' });
    doc.setFontSize(9); doc.setTextColor(130, 160, 255);
    doc.text(`${total} movimientos`, pageWidth - 14, 28, { align: 'right' });

    // KPI summary
    const yKpi = 50;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 110);
    doc.text(`Total: ${stats.totalMovimientos}`, 14, yKpi);
    doc.text(`Entradas hoy: ${stats.entradasHoy}`, 60, yKpi);
    doc.text(`Salidas hoy: ${stats.salidasHoy}`, 110, yKpi);

    // Table
    const tableBody = movimientos.map((m, i) => {
      const { date, time } = formatFecha(m.fecha_registro);
      return [
        String(i + 1),
        m.codigo_movimiento,
        m.productos?.nombre ?? m.producto_id.slice(0, 8),
        getTipoMovimientoLabel(m.tipo_movimiento),
        formatCantidad(m.cantidad, m.tipo_movimiento),
        m.referencia ?? '-',
        `${date} ${time}`,
      ];
    });

    autoTable(doc, {
      startY: yKpi + 10,
      margin: { left: 14, right: 14 },
      head: [['#', 'Código', 'Producto', 'Tipo', 'Cantidad', 'Referencia', 'Fecha']],
      body: tableBody,
      styles: { fontSize: 8, cellPadding: 3, textColor: [30, 30, 38] },
      headStyles: { fillColor: [30, 30, 38], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 248, 252] },
    });

    const footerY = doc.internal.pageSize.getHeight() - 12;
    doc.setFontSize(7); doc.setTextColor(160, 160, 170); doc.setFont('helvetica', 'italic');
    doc.text('Documento generado por SISVENT — Sistema de Ventas e Inventario', pageWidth / 2, footerY, { align: 'center' });

    doc.save(`movimientos_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // ── Export Excel (CSV)
  const handleExportExcel = () => {
    const headers = ['Código,Producto,SKU,Tipo,Cantidad,Referencia,Motivo,Fecha'];
    const rows = movimientos.map((m) => {
      const { date, time } = formatFecha(m.fecha_registro);
      return [
        m.codigo_movimiento,
        `"${m.productos?.nombre ?? ''}"`,
        m.productos?.sku ?? '',
        m.tipo_movimiento,
        m.cantidad,
        `"${m.referencia ?? ''}"`,
        `"${m.motivo ?? ''}"`,
        `"${date} ${time}"`,
      ].join(',');
    });
    const csv = [...headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `movimientos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-8 max-w-[1400px] w-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
            <span>Inventario</span>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-primary font-medium">Movimientos</span>
          </nav>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Movimientos</h2>
          <p className="text-on-surface-variant font-medium mt-1">
            Registro en tiempo real de entradas, salidas y transferencias internas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-br from-primary-dim to-primary text-on-primary-container font-bold px-6 py-2.5 rounded-md flex items-center gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Nuevo Movimiento
          </button>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Movimientos */}
        <div className="p-6 rounded-xl bg-surface-container-low flex flex-col gap-4 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>sync_alt</span>
            </div>
            <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">EN VIVO</span>
          </div>
          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Total Movimientos</p>
          <h3 className="text-3xl font-bold mt-1 tracking-tight text-on-surface">
            {statsLoading ? '...' : stats.totalMovimientos.toLocaleString()}
          </h3>
          <p className="text-[10px] text-tertiary mt-2 flex items-center gap-1 font-bold">
            <span className="material-symbols-outlined text-xs">inventory_2</span>
            Registros activos en el sistema
          </p>
        </div>

        {/* Entradas */}
        <div className="p-6 rounded-xl bg-surface-container-low flex flex-col gap-4 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-tertiary/10 rounded-lg group-hover:bg-tertiary/20 transition-colors">
              <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
            </div>
            <span className="text-xs text-on-surface-variant">Últimas 24h</span>
          </div>
          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Entradas</p>
          <h3 className="text-3xl font-bold mt-1 tracking-tight text-on-surface">
            {statsLoading ? '...' : stats.entradasHoy}
          </h3>
          <div className="w-full bg-surface-container mt-2 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-tertiary h-full rounded-full transition-all duration-700"
              style={{ width: `${stats.totalMovimientos > 0 ? Math.min(100, (stats.entradasHoy / stats.totalMovimientos) * 100 * 5) : 0}%` }}
            />
          </div>
        </div>

        {/* Salidas */}
        <div className="p-6 rounded-xl bg-surface-container-low flex flex-col gap-4 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>logout</span>
            </div>
            <span className="text-xs text-on-surface-variant">Últimas 24h</span>
          </div>
          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Salidas</p>
          <h3 className="text-3xl font-bold mt-1 tracking-tight text-on-surface">
            {statsLoading ? '...' : stats.salidasHoy}
          </h3>
          <div className="w-full bg-surface-container mt-2 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-secondary h-full rounded-full transition-all duration-700"
              style={{ width: `${stats.totalMovimientos > 0 ? Math.min(100, (stats.salidasHoy / stats.totalMovimientos) * 100 * 5) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bar Chart: Intensidad mensual */}
        <div className="md:col-span-2 glass-panel p-6 rounded-xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="font-bold text-lg text-on-surface">Intensidad de Movimientos</h4>
              <p className="text-xs text-on-surface-variant">Histórico de actividad mensual (últimos 12 meses)</p>
            </div>
          </div>
          <div className="h-48 flex items-end justify-between gap-2 px-2 mt-4 pt-4 border-t border-outline-variant/10">
            {historico.length > 0 ? (
              historico.map((data, index) => {
                const heightPct = maxHistorico > 0 ? Math.max(4, (data.total / maxHistorico) * 100) : 4;
                const isCurrentMonth = index === historico.length - 1;
                return (
                  <div key={index} className="w-full group relative h-full flex items-end">
                    <div
                      className={`w-full rounded-t transition-all ${
                        isCurrentMonth
                          ? 'bg-primary hover:opacity-80'
                          : 'bg-primary/20 hover:bg-primary/40'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    >
                      {data.total > 0 && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] font-bold px-2 py-1 rounded hidden group-hover:block whitespace-nowrap shadow-xl z-10">
                          {data.total} mov.
                        </div>
                      )}
                    </div>
                    <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase font-bold ${isCurrentMonth ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {data.month}
                    </span>
                  </div>
                );
              })
            ) : (
              // Skeleton bars
              Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-full h-full flex items-end">
                  <div className="w-full h-[40%] bg-surface-container-highest rounded-t animate-pulse" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Distribución por tipo */}
        <div className="bg-surface-container-low p-6 rounded-xl flex flex-col gap-4">
          <h4 className="font-bold text-lg text-on-surface mb-2">Distribución por Tipo</h4>
          <div className="space-y-5">
            {distribucion.length > 0 ? (
              distribucion.map((d) => {
                const style = getTipoMovimientoStyle(d.tipo);
                return (
                  <div key={d.tipo} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">{getTipoMovimientoLabel(d.tipo)}</span>
                      <span className="font-bold text-on-surface">{d.porcentaje}%</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${style.dot}`}
                        style={{ width: `${d.porcentaje}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              // Fallback with 3 types
              ['ENTRADA', 'SALIDA', 'AJUSTE'].map((tipo) => {
                const style = getTipoMovimientoStyle(tipo as TipoMovimiento);
                return (
                  <div key={tipo} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface-variant">{getTipoMovimientoLabel(tipo)}</span>
                      <span className="font-bold text-on-surface">—</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className={`h-full w-0 rounded-full ${style.dot}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro de fechas */}
          <div className="flex items-center gap-2 bg-surface-container border border-outline-variant/20 rounded-lg px-3 py-2 h-[38px] focus-within:ring-2 focus-within:ring-primary/40 transition-all">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">calendar_today</span>
            <input
              type="date"
              className="bg-transparent border-none text-sm text-on-surface outline-none cursor-pointer p-0"
              style={{ colorScheme: 'dark' }}
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              title="Desde"
            />
          </div>
          <span className="text-on-surface-variant text-xs font-bold">–</span>
          <div className="flex items-center gap-2 bg-surface-container border border-outline-variant/20 rounded-lg px-3 py-2 h-[38px] focus-within:ring-2 focus-within:ring-primary/40 transition-all">
            <input
              type="date"
              className="bg-transparent border-none text-sm text-on-surface outline-none cursor-pointer p-0"
              style={{ colorScheme: 'dark' }}
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              title="Hasta"
            />
          </div>

          {/* Tipo filter */}
          <select
            className="bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/40 transition-all outline-none appearance-none cursor-pointer h-[38px]"
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
          >
            <option value="">Tipo: Todos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="AJUSTE">Ajuste</option>
          </select>

          <button
            onClick={handleExportPDF}
            className="bg-surface-container text-on-surface px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold hover:bg-surface-variant/50 transition-all border border-outline-variant/10 h-[38px]"
          >
            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
            PDF
          </button>

          <button
            onClick={handleExportExcel}
            className="bg-surface-container text-on-surface px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold hover:bg-surface-variant/50 transition-all border border-outline-variant/10 h-[38px]"
          >
            <span className="material-symbols-outlined text-lg">table_chart</span>
            Excel
          </button>

          {/* Search + Buscar */}
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input
                className="bg-surface-container border border-outline-variant/20 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none h-[38px]"
                placeholder="Buscar movimientos..."
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
              />
            </div>
            <button
              onClick={executeSearch}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-bold transition-all text-sm h-[38px]"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              Buscar
            </button>
            {(fechaInicio || fechaFin || tipoFilter || searchInput) && (
              <button
                onClick={handleLimpiar}
                className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all h-[38px]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Table header + pagination */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <h4 className="font-bold text-lg text-on-surface">Registro de Actividad Detallado</h4>
          <div className="flex items-center gap-3">
            <span className="text-xs text-on-surface-variant font-medium">
              {tableLoading ? 'Buscando...' : total === 0 ? 'Sin resultados' : `Mostrando ${fromItem}–${toItem} de ${total}`}
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1 || tableLoading}
                onClick={() => handlePageChange(page - 1)}
                className="p-1.5 bg-surface-container-highest rounded-md text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button
                disabled={page >= totalPages || tableLoading}
                onClick={() => handlePageChange(page + 1)}
                className="p-1.5 bg-surface-container-highest rounded-md text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-low shadow-2xl shadow-black/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-surface-container-high/50 border-b border-outline-variant/10">
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">ID Transacción</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Origen → Destino</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-outline-variant/5 relative transition-opacity duration-200 ${tableLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                {tableLoading && (
                  <tr><td colSpan={6} className="p-0">
                    <div className="absolute top-0 left-0 right-0 h-0.5 z-10 bg-primary/20 overflow-hidden">
                      <div className="h-full bg-primary w-1/3 animate-pulse rounded-full" />
                    </div>
                  </td></tr>
                )}
                {initialLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-5"><div className="h-4 bg-surface-container-highest rounded w-20" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-surface-container-highest rounded w-24" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-surface-container-highest rounded w-32" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-surface-container-highest rounded w-36" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-surface-container-highest rounded w-16" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-surface-container-highest rounded w-24" /></td>
                    </tr>
                  ))
                ) : movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                        <span className="material-symbols-outlined text-5xl opacity-30">sync_alt</span>
                        <p className="font-semibold">No se encontraron movimientos</p>
                        <p className="text-xs">Usa el botón &quot;Nuevo Movimiento&quot; para registrar</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  movimientos.map((mov) => {
                    // Defensive: fallback if tipo_movimiento is null (legacy rows)
                    const tipoSafe = (mov.tipo_movimiento ?? 'SALIDA') as TipoMovimiento;
                    const style = getTipoMovimientoStyle(tipoSafe);
                    const { date, time } = formatFecha(mov.fecha_registro);
                    const cantLabel = formatCantidad(mov.cantidad, tipoSafe);

                    return (
                      <tr key={mov.id} className="hover:bg-surface-container transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${style.dot} ${style.shadow}`} />
                            <span className={`text-xs font-bold ${style.text}`}>
                              {getTipoMovimientoLabel(tipoSafe).toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-xs font-mono text-on-surface-variant">#{mov.codigo_movimiento}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded ${style.bg} flex items-center justify-center`}>
                              <span className={`material-symbols-outlined text-lg ${style.text}`}
                                style={{ fontVariationSettings: "'FILL' 1" }}>
                                {style.icon}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-on-surface">{mov.productos?.nombre ?? '—'}</p>
                              <p className="text-[10px] text-on-surface-variant font-mono">{mov.productos?.sku ?? ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-on-surface-variant">{mov.origen ?? '—'}</span>
                            <span className={`material-symbols-outlined text-xs ${
                              mov.tipo_movimiento === 'TRANSFERENCIA' ? 'text-primary' : 'text-on-surface-variant'
                            }`}>
                              {mov.tipo_movimiento === 'TRANSFERENCIA' ? 'swap_horiz' : 'arrow_forward'}
                            </span>
                            <span className="font-medium text-on-surface">{mov.destino ?? '—'}</span>
                          </div>
                          {mov.referencia && (
                            <p className="text-[10px] text-primary/70 mt-0.5 font-mono">{mov.referencia}</p>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`text-sm font-bold ${style.text}`}>{cantLabel}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-on-surface">{date}</span>
                            <span className="text-[10px] text-on-surface-variant">{time}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Info */}
          <div className="px-6 py-4 bg-surface-container-high/30 flex items-center justify-between border-t border-outline-variant/10">
            <div className="flex gap-4">
              {[
                { label: 'Entrada', dot: 'bg-tertiary' },
                { label: 'Salida', dot: 'bg-secondary' },
                { label: 'Transferencia', dot: 'bg-primary' },
                { label: 'Ajuste', dot: 'bg-error' },
              ].map(({ label, dot }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{label}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-on-surface-variant italic">
              {total} movimientos registrados
            </div>
          </div>
        </div>
      </div>

      <EntradaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}

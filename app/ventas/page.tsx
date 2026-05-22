'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  VentaDB,
  VentaStats,
  getEstadoVentaStyle,
  getEstadoVentaLabel,
  getClienteInitialStyle,
  getClienteDisplayName,
  getClienteInitials,
  formatSoles,
} from '@/lib/types/venta';
import {
  getVentas,
  getVentasStats,
  anularVenta,
  getVentaById,
} from '@/app/ventas/actions';
import { VentaModal } from '@/components/modules/ventas/VentaModal';

export default function VentasPage() {
  // ── Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedVenta, setSelectedVenta] = useState<VentaDB | null>(null);

  // ── List state
  const [ventas, setVentas] = useState<VentaDB[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [initialLoading, setInitialLoading] = useState(true); // skeleton on first load only
  const [tableLoading, setTableLoading] = useState(false);    // overlay on subsequent fetches
  const [error, setError] = useState<string | null>(null);

  // ── Filters
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // ── Stats
  const [stats, setStats] = useState<VentaStats>({ ventaMes: 0, ventaDia: 0, totalOperaciones: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Derived pagination
  const totalPages = Math.ceil(total / limit);
  const fromItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const toItem = Math.min(page * limit, total);

  // ── Fetch helpers
  const fetchVentas = useCallback(async (p: number, search: string, estado: string, fInicio: string, fFin: string) => {
    // Use overlay loading (not skeleton) to avoid layout jump
    setTableLoading(true);
    setError(null);
    const result = await getVentas({ page: p, limit, search, estado, fechaInicio: fInicio, fechaFin: fFin });
    if (result.error) {
      setError(result.error);
    } else {
      setVentas(result.data.data);
      setTotal(result.data.total);
    }
    setTableLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    const result = await getVentasStats();
    if (!result.error) setStats(result.data);
    setStatsLoading(false);
  }, []);

  // ── Initial load (parallelized) — only runs once, uses skeleton via initialLoading
  useEffect(() => {
    async function init() {
      const [ventasResult, statsResult] = await Promise.all([
        getVentas({ page: 1, limit, search: '', estado: '', fechaInicio: '', fechaFin: '' }),
        getVentasStats(),
      ]);
      if (!ventasResult.error) {
        setVentas(ventasResult.data.data);
        setTotal(ventasResult.data.total);
      }
      if (!statsResult.error) setStats(statsResult.data);
      setInitialLoading(false);
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

  const executeSearch = () => {
    setPage(1);
    setActiveSearch(searchInput);
    fetchVentas(1, searchInput, estadoFilter, fechaInicio, fechaFin);
  };

  const handleLimpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
    setEstadoFilter('');
    setSearchInput('');
    setActiveSearch('');
    setPage(1);
    fetchVentas(1, '', '', '', '');
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchVentas(newPage, activeSearch, estadoFilter, fechaInicio, fechaFin);
  };

  const handleOpenNew = () => {
    setModalMode('create');
    setSelectedVenta(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (venta: VentaDB) => {
    setModalMode('edit');
    setSelectedVenta(venta);
    setIsModalOpen(true);
  };

  const handleOpenView = (venta: VentaDB) => {
    setModalMode('view');
    setSelectedVenta(venta);
    setIsModalOpen(true);
  };

  const handleClose = () => setIsModalOpen(false);

  const handleSaved = async () => {
    await Promise.all([
      fetchVentas(modalMode === 'create' ? 1 : page, activeSearch, estadoFilter, fechaInicio, fechaFin),
      fetchStats(),
    ]);
    if (modalMode === 'create') setPage(1);
  };

  const handleAnular = async (venta: VentaDB) => {
    if (!confirm(`¿Está seguro de anular la venta ${venta.codigo_venta}?`)) return;
    const result = await anularVenta(venta.id);
    if (result.error) {
      alert(result.error);
    } else {
      await Promise.all([
        fetchVentas(page, activeSearch, estadoFilter, fechaInicio, fechaFin),
        fetchStats(),
      ]);
    }
  };

  const handlePrintPDF = async (venta: VentaDB) => {
    // Load full venta with detalles + client info
    const result = await getVentaById(venta.id);
    if (result.error || !result.data) {
      alert('Error al cargar datos para PDF');
      return;
    }
    const fullVenta = result.data;

    // Dynamic imports — must be inside event handler to avoid SSR bundling
    const jsPDFModule = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    const jsPDF = jsPDFModule.default;
    const autoTable = autoTableModule.default;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(30, 30, 38);
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('SISVENT', 14, 22);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 200);
    doc.text('Sistema de Ventas e Inventario', 14, 30);
    doc.text('RUC: 20100000001 | Lima, Perú', 14, 36);
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('BOLETA DE VENTA', pageWidth - 14, 22, { align: 'right' });
    doc.setFontSize(11);
    doc.setTextColor(130, 160, 255);
    doc.text(`#${fullVenta.codigo_venta}`, pageWidth - 14, 32, { align: 'right' });

    // Client info
    const yInfo = 55;
    const cName = getClienteDisplayName(fullVenta.clientes);
    const cDoc = fullVenta.clientes?.documento ?? '-';
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 110);
    doc.text('CLIENTE:', 14, yInfo);
    doc.setTextColor(30, 30, 38);
    doc.setFont('helvetica', 'bold');
    doc.text(cName, 14, yInfo + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 110);
    doc.text(`Doc: ${cDoc}`, 14, yInfo + 12);
    if (fullVenta.clientes?.email) doc.text(`Email: ${fullVenta.clientes.email}`, 14, yInfo + 18);
    if (fullVenta.clientes?.telefono) doc.text(`Tel: ${fullVenta.clientes.telefono}`, 14, yInfo + 24);

    doc.setTextColor(100, 100, 110);
    doc.text('FECHA:', pageWidth - 14, yInfo, { align: 'right' });
    doc.setTextColor(30, 30, 38);
    doc.setFont('helvetica', 'bold');
    doc.text(fullVenta.fecha_emision, pageWidth - 14, yInfo + 6, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 110);
    doc.text('ESTADO:', pageWidth - 14, yInfo + 14, { align: 'right' });
    doc.setTextColor(30, 30, 38);
    doc.setFont('helvetica', 'bold');
    doc.text(getEstadoVentaLabel(fullVenta.estado).toUpperCase(), pageWidth - 14, yInfo + 20, { align: 'right' });

    // Separator
    const ySep = yInfo + 32;
    doc.setDrawColor(220, 220, 230);
    doc.setLineWidth(0.5);
    doc.line(14, ySep, pageWidth - 14, ySep);

    // Product table
    const tableBody = (fullVenta.venta_detalle ?? []).map((d, i) => [
      String(i + 1),
      d.productos?.nombre ?? d.producto_id,
      d.productos?.sku ?? '-',
      String(d.cantidad),
      formatSoles(Number(d.precio_unitario)),
      formatSoles(Number(d.subtotal)),
    ]);

    autoTable(doc, {
      startY: ySep + 6,
      margin: { left: 14, right: 14 },
      head: [['#', 'Producto', 'SKU', 'Cant.', 'P. Unit.', 'Subtotal']],
      body: tableBody,
      styles: { fontSize: 9, cellPadding: 4, textColor: [30, 30, 38], lineColor: [230, 230, 240], lineWidth: 0.3 },
      headStyles: { fillColor: [30, 30, 38], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 248, 252] },
      columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 3: { halign: 'center', cellWidth: 18 }, 4: { halign: 'right', cellWidth: 30 }, 5: { halign: 'right', cellWidth: 30, fontStyle: 'bold' } },
    });

    // Financial summary
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const sx = pageWidth - 14;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 110);
    doc.text('Subtotal:', sx - 50, finalY);
    doc.setTextColor(30, 30, 38);
    doc.text(formatSoles(Number(fullVenta.subtotal)), sx, finalY, { align: 'right' });
    doc.setTextColor(100, 100, 110);
    doc.text('IGV (18%):', sx - 50, finalY + 8);
    doc.setTextColor(30, 30, 38);
    doc.text(formatSoles(Number(fullVenta.igv)), sx, finalY + 8, { align: 'right' });
    doc.setDrawColor(130, 160, 255);
    doc.setLineWidth(0.8);
    doc.line(sx - 55, finalY + 14, sx, finalY + 14);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 60);
    doc.text('TOTAL:', sx - 50, finalY + 22);
    doc.setTextColor(50, 80, 200);
    doc.text(formatSoles(Number(fullVenta.total)), sx, finalY + 22, { align: 'right' });

    // Observations
    if (fullVenta.observaciones) {
      const obsY = finalY + 36;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 110);
      doc.text('OBSERVACIONES:', 14, obsY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 70);
      doc.text(doc.splitTextToSize(fullVenta.observaciones, pageWidth - 28), 14, obsY + 6);
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 170);
    doc.setFont('helvetica', 'italic');
    doc.text('Documento generado por SISVENT — Sistema de Ventas e Inventario', pageWidth / 2, footerY, { align: 'center' });

    doc.save(`${fullVenta.codigo_venta}.pdf`);
  };

  // Percentage for progress bar (mock meta: S/ 170,000)
  const meta = 170000;
  const progressPct = Math.min(100, (stats.ventaMes / meta) * 100);

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
            <span>Ventas</span>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-primary font-medium">Gestión de Ventas</span>
          </nav>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Registro de Ventas</h2>
        </div>
        <button 
          onClick={handleOpenNew}
          className="bg-primary-container text-on-primary-container px-6 py-3 rounded-md font-bold flex items-center gap-2 active:scale-95 transition-transform shadow-lg shadow-primary/10"
        >
          <span className="material-symbols-outlined shrink-0">add</span>
          Crear Nueva Venta
        </button>
      </div>

      {/* Bento Grid Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        
        {/* Featured Card: Venta del Mes */}
        <div className="sm:col-span-2 bg-surface-container-low p-6 rounded-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: '"FILL" 1' }}>payments</span>
          </div>
          <div className="relative z-10">
            <p className="text-on-surface-variant text-sm font-medium mb-1">Venta total del mes actual</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-on-surface">
                {statsLoading ? '...' : formatSoles(stats.ventaMes)}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-1 flex-1 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }}></div>
              </div>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-2 uppercase tracking-widest font-bold">
              Meta: S/ 170,000 este mes
            </p>
          </div>
        </div>

        {/* Stats Card: Day Revenue */}
        <div className="bg-surface-container p-6 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>point_of_sale</span>
            </div>
            <span className="text-xs text-on-surface-variant">Hoy</span>
          </div>
          <div>
            <p className="text-2xl font-bold mt-4 text-on-surface">
              {statsLoading ? '...' : formatSoles(stats.ventaDia)}
            </p>
            <p className="text-xs text-on-surface-variant uppercase font-bold tracking-tighter mt-1">Venta del día (acumulado)</p>
          </div>
        </div>

        {/* Stats Card: Count */}
        <div className="bg-surface-container p-6 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-tertiary/10 rounded-lg">
              <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: '"FILL" 1' }}>shopping_bag</span>
            </div>
            <span className="text-xs text-on-surface-variant">Operaciones</span>
          </div>
          <div>
            <p className="text-2xl font-bold mt-4 text-on-surface">
              {statsLoading ? '...' : stats.totalOperaciones.toLocaleString()}
            </p>
            <p className="text-xs text-on-surface-variant uppercase font-bold tracking-tighter mt-1">Cantidad de ventas hechas</p>
          </div>
        </div>

      </div>

      {/* Orders Table Layout */}
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
                  placeholder="Buscar por código o cliente..."
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
                <option value="completado">Completado</option>
                <option value="pendiente">Pendiente</option>
                <option value="anulado">Anulado</option>
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
                  onChange={(e) => setFechaInicio(e.target.value)}
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
                  onChange={(e) => setFechaFin(e.target.value)}
                  title="Fecha fin"
                />
              </div>

              {/* Acciones */}
              <button
                type="button"
                onClick={executeSearch}
                className="flex items-center gap-1.5 ml-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-bold transition-all text-sm shadow-sm"
                title="Ejecutar búsqueda"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                Buscar
              </button>

              {(fechaInicio || fechaFin || estadoFilter || searchInput) && (
                <button
                  type="button"
                  onClick={handleLimpiarFiltros}
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
                {tableLoading ? 'Buscando...' : total === 0 ? 'Sin resultados' : `Mostrando ${fromItem}-${toItem} de ${total}`}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1 || tableLoading}
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  className="p-1.5 bg-surface-container-highest rounded-md text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <button
                  disabled={page >= totalPages || tableLoading}
                  onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                  className="p-1.5 bg-surface-container-highest rounded-md text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Table */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="grid grid-cols-6 px-8 py-4 bg-surface-container-high/30 text-[10px] uppercase tracking-widest font-black text-on-surface-variant border-b border-outline-variant/10">
              <div className="col-span-1">ID de Venta</div>
              <div className="col-span-1">Cliente</div>
              <div className="col-span-1">Fecha de Emisión</div>
              <div className="col-span-1">Monto</div>
              <div className="col-span-1">Estado</div>
              <div className="col-span-1 text-right">Acciones</div>
            </div>

            {/* Table Body */}
            <div className={`divide-y divide-outline-variant/5 relative transition-opacity duration-200 ${tableLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {/* Loading indicator — thin top line, no layout shift */}
              {tableLoading && (
                <div className="absolute top-0 left-0 right-0 h-0.5 z-10 bg-primary/20 overflow-hidden">
                  <div className="h-full bg-primary w-1/3 animate-pulse rounded-full" />
                </div>
              )}
              {initialLoading ? (
                // Skeleton rows — only on first load
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-6 px-8 py-5 items-center animate-pulse">
                    <div className="col-span-1"><div className="h-4 bg-surface-container-highest rounded w-24" /></div>
                    <div className="col-span-1 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-highest" />
                      <div className="h-4 bg-surface-container-highest rounded w-28" />
                    </div>
                    <div className="col-span-1"><div className="h-4 bg-surface-container-highest rounded w-24" /></div>
                    <div className="col-span-1"><div className="h-4 bg-surface-container-highest rounded w-20" /></div>
                    <div className="col-span-1"><div className="h-5 bg-surface-container-highest rounded-full w-20" /></div>
                    <div className="col-span-1"><div className="h-4 bg-surface-container-highest rounded w-16 ml-auto" /></div>
                  </div>
                ))
              ) : ventas.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl opacity-30">
                      receipt_long
                    </span>
                    <p className="font-semibold">No se encontraron ventas</p>
                    <p className="text-xs">Usa el botón &quot;Crear Nueva Venta&quot; para empezar</p>
                  </div>
                </div>
              ) : (
                ventas.map((venta, i) => {
                  const style = getEstadoVentaStyle(venta.estado);
                  const clientStyle = getClienteInitialStyle(i);
                  const clienteName = getClienteDisplayName(venta.clientes);
                  const initials = getClienteInitials(clienteName);

                  return (
                    <div key={venta.id} className="grid grid-cols-6 px-8 py-5 items-center hover:bg-surface-container/50 transition-colors group">
                      
                      <div className="col-span-1">
                        <span className="font-bold text-on-surface group-hover:text-primary transition-colors">
                          #{venta.codigo_venta}
                        </span>
                      </div>
                      
                      <div className="col-span-1 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${clientStyle.bg} flex items-center justify-center text-xs font-bold ${clientStyle.text} border border-outline-variant/20`}>
                          {initials}
                        </div>
                        <span className="text-sm font-bold text-on-surface truncate pr-2">
                          {clienteName}
                        </span>
                      </div>
                      
                      <div className="col-span-1 text-sm text-on-surface-variant font-medium">
                        {venta.fecha_emision}
                      </div>

                      <div className="col-span-1 font-extrabold text-on-surface">
                        {formatSoles(Number(venta.total))}
                      </div>

                      <div className="col-span-1">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${style.bg} ${style.text}`}>
                          {getEstadoVentaLabel(venta.estado)}
                        </span>
                      </div>

                      <div className="col-span-1 text-right">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1">
                          <button 
                            className="p-2 hover:bg-surface-variant rounded-lg text-on-surface-variant transition-colors"
                            title="Ver detalles"
                            onClick={() => handleOpenView(venta)}
                          >
                            <span className="material-symbols-outlined text-xl">visibility</span>
                          </button>
                          <button 
                            className="p-2 hover:bg-surface-variant rounded-lg text-on-surface-variant transition-colors"
                            title="Imprimir PDF"
                            onClick={() => handlePrintPDF(venta)}
                          >
                            <span className="material-symbols-outlined text-xl">print</span>
                          </button>
                          <button 
                            className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg text-on-surface-variant transition-colors"
                            title="Editar"
                            onClick={() => handleOpenEdit(venta)}
                          >
                            <span className="material-symbols-outlined text-xl">edit</span>
                          </button>
                          {venta.estado !== 'anulado' && (
                            <button 
                              className="p-2 hover:bg-error/10 hover:text-error rounded-lg text-on-surface-variant transition-colors"
                              title="Anular"
                              onClick={() => handleAnular(venta)}
                            >
                              <span className="material-symbols-outlined text-xl">block</span>
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
              <span className="w-2 h-2 rounded-full bg-tertiary/40"></span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Completadas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary/40"></span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Pendientes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-error/40"></span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Anuladas</span>
            </div>
          </div>
          <span className="text-xs text-on-surface-variant italic">
            {total} ventas encontradas
          </span>
        </div>

      </div>

      <VentaModal 
        isOpen={isModalOpen}
        onClose={handleClose}
        onSaved={handleSaved}
        mode={modalMode}
        venta={selectedVenta}
      />
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { MOCK_VENTAS, getEstadoVentaStyle, getClienteInitialStyle, VentaDB } from '@/lib/types/venta';
import { VentaModal } from '@/components/modules/ventas/VentaModal';

export default function VentasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedVenta, setSelectedVenta] = useState<VentaDB | null>(null);
  const [ventas] = useState<VentaDB[]>(MOCK_VENTAS);
  
  const [searchInput, setSearchInput] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');

  const total = ventas.length;

  // Filter ventas logic
  const filteredVentas = ventas.filter(v => {
    const matchSearch = v.cliente.nombre.toLowerCase().includes(searchInput.toLowerCase()) || 
                        v.codigo_venta.toLowerCase().includes(searchInput.toLowerCase());
    const matchStatus = estadoFilter ? v.estado === estadoFilter : true;
    return matchSearch && matchStatus;
  });
  const displayedTotal = filteredVentas.length;

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

  return (
    <div className="p-8 pb-12">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        
        {/* Featured Card: Venta del Mes */}
        <div className="md:col-span-2 bg-surface-container-low p-6 rounded-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: '"FILL" 1' }}>payments</span>
          </div>
          <div className="relative z-10">
            <p className="text-on-surface-variant text-sm font-medium mb-1">Venta total del mes actual</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-on-surface">S/ 128,430</span>
              <span className="text-xs px-2 py-1 bg-tertiary/10 text-tertiary rounded-full font-bold">+12.4%</span>
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-1 flex-1 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[75%] rounded-full"></div>
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
            <p className="text-2xl font-bold mt-4 text-on-surface">S/ 4,230</p>
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
            <p className="text-2xl font-bold mt-4 text-on-surface">1,432</p>
            <p className="text-xs text-on-surface-variant uppercase font-bold tracking-tighter mt-1">Cantidad de ventas hechas</p>
          </div>
        </div>

      </div>

      {/* Orders Table Layout */}
      <div className="bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant/10 shadow-2xl shadow-black/40">
        
        {/* Table Controls */}
        <div className="p-6 flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                className="w-full bg-surface-container border border-outline-variant/20 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none"
                placeholder="Buscar por ID o Cliente..."
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <select
              className="bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/40 transition-all outline-none appearance-none cursor-pointer"
              onChange={(e) => setEstadoFilter(e.target.value)}
              value={estadoFilter}
            >
              <option value="">Estado: Todos</option>
              <option value="Completado">Completado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant font-medium">
              {displayedTotal === 0 ? 'Sin resultados' : `Mostrando 1-${displayedTotal} de ${displayedTotal}`}
            </span>
            <div className="flex gap-1">
              <button
                disabled={true}
                className="p-1.5 bg-surface-container-highest rounded-md text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button
                disabled={true}
                className="p-1.5 bg-surface-container-highest rounded-md text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
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
            <div className="divide-y divide-outline-variant/5">
              {filteredVentas.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl opacity-30">
                      receipt_long
                    </span>
                    <p className="font-semibold">No se encontraron ventas</p>
                    <p className="text-xs">Usa el botón "Crear Nueva Venta" para empezar</p>
                  </div>
                </div>
              ) : (
                filteredVentas.map((venta, i) => {
                  const style = getEstadoVentaStyle(venta.estado);
                  const clientStyle = getClienteInitialStyle(i);

                  return (
                    <div key={venta.id} className="grid grid-cols-6 px-8 py-5 items-center hover:bg-surface-container/50 transition-colors group">
                      
                      <div className="col-span-1">
                        <span className="font-bold text-on-surface group-hover:text-primary transition-colors">
                          #{venta.codigo_venta}
                        </span>
                      </div>
                      
                      <div className="col-span-1 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${clientStyle.bg} flex items-center justify-center text-xs font-bold ${clientStyle.text} border border-outline-variant/20`}>
                          {venta.cliente.iniciales}
                        </div>
                        <span className="text-sm font-bold text-on-surface truncate pr-2">
                          {venta.cliente.nombre}
                        </span>
                      </div>
                      
                      <div className="col-span-1 text-sm text-on-surface-variant font-medium">
                        {venta.fecha_emision}
                      </div>

                      <div className="col-span-1 font-extrabold text-on-surface">
                        S/ {venta.monto_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>

                      <div className="col-span-1">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${style.bg} ${style.text}`}>
                          {venta.estado}
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
                            title="Descargar Boleta/Factura"
                          >
                            <span className="material-symbols-outlined text-xl">receipt</span>
                          </button>
                          <button 
                            className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg text-on-surface-variant transition-colors"
                            title="Editar"
                            onClick={() => handleOpenEdit(venta)}
                          >
                            <span className="material-symbols-outlined text-xl">edit</span>
                          </button>
                          <button 
                            className="p-2 hover:bg-error/10 hover:text-error rounded-lg text-on-surface-variant transition-colors"
                            title="Eliminar"
                          >
                            <span className="material-symbols-outlined text-xl">delete</span>
                          </button>
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
              <span className="w-2 h-2 rounded-full bg-primary/40"></span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Activas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tertiary/40"></span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Concluidas</span>
            </div>
          </div>
          <span className="text-xs text-on-surface-variant italic">
            {displayedTotal} ventas encontradas
          </span>
        </div>

      </div>

      <VentaModal 
        isOpen={isModalOpen}
        onClose={handleClose}
        mode={modalMode}
        venta={selectedVenta}
      />
    </div>
  );
}

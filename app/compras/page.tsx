'use client';

import React, { useState } from 'react';
import { MOCK_COMPRAS, getEstadoCompraStyle, getProveedorInitialStyle, CompraDB } from '@/lib/types/compra';
import { CompraModal } from '@/components/modules/compras/CompraModal';

export default function ComprasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedCompra, setSelectedCompra] = useState<CompraDB | null>(null);
  const [compras] = useState<CompraDB[]>(MOCK_COMPRAS);
  
  const [searchInput, setSearchInput] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');

  // Pagination mocks
  const total = compras.length;
  // This is a UI mockup so we'll just display all for now or fake pagination logic
  const page = 1;

  // Filter compras logic (client side for mock)
  const filteredCompras = compras.filter(c => {
    const matchSearch = c.proveedor.nombre.toLowerCase().includes(searchInput.toLowerCase()) || c.codigo_orden.toLowerCase().includes(searchInput.toLowerCase());
    const matchCat = categoriaFilter ? c.estado === categoriaFilter : true;
    return matchSearch && matchCat;
  });
  const displayedTotal = filteredCompras.length;

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

  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
           {/* Breadcrumbs-like */}
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

      {/* Bento Grid Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        
        {/* Featured Card: Total Pending */}
        <div className="md:col-span-2 bg-surface-container-low p-6 rounded-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: '"FILL" 1' }}>payments</span>
          </div>
          <div className="relative z-10">
            <p className="text-on-surface-variant text-sm font-medium mb-1">Valor Total de Pedidos Pendientes</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-on-surface">S/ 284,590</span>
              <span className="text-xs px-2 py-1 bg-tertiary/10 text-tertiary rounded-full font-bold">+12.5%</span>
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-1 flex-1 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[65%]"></div>
              </div>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-2 uppercase tracking-widest font-bold">
              Meta: S/ 400,000 este mes
            </p>
          </div>
        </div>

        {/* Stats Card 1 */}
        <div className="bg-surface-container p-6 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>pending_actions</span>
            </div>
            <span className="text-xs text-on-surface-variant">Activas</span>
          </div>
          <div>
            <p className="text-2xl font-bold mt-4 text-on-surface">24</p>
            <p className="text-xs text-on-surface-variant uppercase font-bold tracking-tighter">Pendientes de Aprobación</p>
          </div>
        </div>

        {/* Stats Card 2 */}
        <div className="bg-surface-container p-6 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-tertiary/10 rounded-lg">
              <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: '"FILL" 1' }}>local_shipping</span>
            </div>
            <span className="text-xs text-on-surface-variant">En Tránsito</span>
          </div>
          <div>
            <p className="text-2xl font-bold mt-4 text-on-surface">12</p>
            <p className="text-xs text-on-surface-variant uppercase font-bold tracking-tighter">Esperados para Hoy</p>
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
                placeholder="Buscar por ID o Proveedor..."
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <select
              className="bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/40 transition-all outline-none appearance-none cursor-pointer"
              onChange={(e) => setCategoriaFilter(e.target.value)}
              value={categoriaFilter}
            >
              <option value="">Estado: Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Recibido">Recibido</option>
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
              <div className="col-span-1">ID de Pedido</div>
              <div className="col-span-1">Proveedor</div>
              <div className="col-span-1">Fecha de Emisión</div>
              <div className="col-span-1">Monto</div>
              <div className="col-span-1">Estado</div>
              <div className="col-span-1 text-right">Acciones</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-outline-variant/5">
              {filteredCompras.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl opacity-30">
                      receipt_long
                    </span>
                    <p className="font-semibold">No se encontraron órdenes</p>
                    <p className="text-xs">Usa el botón "Crear Nueva Orden" para empezar</p>
                  </div>
                </div>
              ) : (
                filteredCompras.map((compra, i) => {
                  const style = getEstadoCompraStyle(compra.estado);
                  const providerStyle = getProveedorInitialStyle(i);

                  return (
                    <div key={compra.id} className="grid grid-cols-6 px-8 py-5 items-center hover:bg-surface-container/50 transition-colors group">
                      
                      <div className="col-span-1">
                        <span className="font-bold text-on-surface group-hover:text-primary transition-colors">
                          #{compra.codigo_orden}
                        </span>
                      </div>
                      
                      <div className="col-span-1 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${providerStyle.bg} flex items-center justify-center text-xs font-bold ${providerStyle.text} border border-outline-variant/20`}>
                          {compra.proveedor.iniciales}
                        </div>
                        <span className="text-sm font-bold text-on-surface truncate pr-2">
                          {compra.proveedor.nombre}
                        </span>
                      </div>
                      
                      <div className="col-span-1 text-sm text-on-surface-variant font-medium">
                        {compra.fecha_emision}
                      </div>

                      <div className="col-span-1 font-extrabold text-on-surface">
                        S/ {compra.monto_total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>

                      <div className="col-span-1">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${style.bg} ${style.text}`}>
                          {compra.estado}
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
                          <button 
                            className="p-2 hover:bg-surface-variant rounded-lg text-on-surface-variant transition-colors"
                            title="Descargar PDF"
                          >
                            <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                          </button>
                          <button 
                            className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg text-on-surface-variant transition-colors"
                            title="Editar"
                            onClick={() => handleOpenEdit(compra)}
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
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Pendientes</span>
            </div>
          </div>
          <span className="text-xs text-on-surface-variant italic">
            {displayedTotal} compras encontrados
          </span>
        </div>

      </div>

      <CompraModal 
        isOpen={isModalOpen}
        onClose={handleClose}
        mode={modalMode}
        compra={selectedCompra}
      />
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';

interface CartItem {
  id: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
}

interface VentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  mode?: 'create' | 'edit' | 'view';
  venta?: any;
}

export function VentaModal({ isOpen, onClose, onSave, mode = 'create', venta }: VentaModalProps) {
  const generateId = () => Math.random().toString(36).substring(2, 9);
  
  const isView = mode === 'view';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detalles, setDetalles] = useState<CartItem[]>([
    { id: generateId(), productoNombre: 'Monitor Gamer 27" UltraWide', cantidad: 2, precioUnitario: 850.00 },
    { id: generateId(), productoNombre: 'Teclado Mecánico RGB Pro', cantidad: 1, precioUnitario: 250.00 },
  ]);

  const subtotal = useMemo(() => {
    return detalles.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);
  }, [detalles]);

  const igv = useMemo(() => subtotal * 0.18, [subtotal]);
  const total = useMemo(() => subtotal + igv, [subtotal, igv]);

  const handleAddItem = () => {
    setDetalles([...detalles, { id: generateId(), productoNombre: '', cantidad: 1, precioUnitario: 0 }]);
  };

  const handeRemoveItem = (id: string) => {
    setDetalles(detalles.filter(d => d.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof CartItem, value: any) => {
    setDetalles(detalles.map(d => {
      if (d.id === id) {
        return { ...d, [field]: value };
      }
      return d;
    }));
  };

  const handleSaveWrapper = async () => {
    setIsSubmitting(true);
    await new Promise(res => setTimeout(res, 600));
    setIsSubmitting(false);
    if (onSave) onSave({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-container-lowest/80 backdrop-blur-md p-4 lg:p-8">
      {/* MODAL CONTAINER */}
      <div className="w-full max-w-5xl bg-surface-container-low rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-outline-variant/20">
        
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-outline-variant/15 flex justify-between items-center bg-surface-container-high/30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(77,124,254,0.2)]">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>shopping_cart</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface tracking-tight">
                {mode === 'create' ? 'Nueva Venta' : mode === 'edit' ? 'Editar Venta' : 'Detalle de Venta'}
              </h2>
              <p className="text-sm text-on-surface-variant">
                {isView ? 'Visualizando los detalles de la transacción.' : 'Complete los detalles para procesar la transacción.'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 relative outline-none custom-scrollbar">
          
          {/* Section 1: Header Fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Cliente <span className="text-error">*</span>
              </label>
              <div className="relative group">
                <select 
                  className="w-full bg-surface-container-highest border-none rounded-md text-on-surface py-3 px-4 focus:ring-2 focus:ring-primary appearance-none cursor-pointer outline-none disabled:opacity-70"
                  disabled={isView}
                >
                  <option value="">Seleccione un cliente...</option>
                  <option value="c1">Corporación Inka S.A.C.</option>
                  <option value="c2">Distribuidora Lima Norte</option>
                  <option value="c3">Juan Pérez Martínez</option>
                </select>
                {!isView && <span className="material-symbols-outlined absolute right-4 top-3 text-on-surface-variant pointer-events-none group-hover:text-primary transition-colors">expand_more</span>}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Fecha de Emisión <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input 
                  type="date" 
                  className="w-full bg-surface-container-highest border-none rounded-md text-on-surface py-3 px-4 focus:ring-2 focus:ring-primary outline-none disabled:opacity-70" 
                  style={{ colorScheme: 'dark' }} 
                  defaultValue={new Date().toISOString().split('T')[0]} 
                  disabled={isView}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Estado <span className="text-error">*</span>
              </label>
              <div className="relative group">
                <select 
                  className="w-full bg-surface-container-highest border-none rounded-md text-on-surface py-3 px-4 focus:ring-2 focus:ring-primary appearance-none cursor-pointer outline-none disabled:opacity-70"
                  disabled={isView}
                >
                  <option value="Completado">Completado</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
                {!isView && <span className="material-symbols-outlined absolute right-4 top-3 text-on-surface-variant pointer-events-none">expand_more</span>}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Nº de Venta <span className="text-error">*</span>
              </label>
              <input 
                type="text" 
                className="w-full bg-surface-container-highest border-none rounded-md text-primary font-bold py-3 px-4 focus:ring-2 focus:ring-primary outline-none" 
                defaultValue="V-000842" 
                readOnly
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">COMENTARIOS</label>
              <input 
                type="text" 
                className="w-full bg-surface-container-highest border-none rounded-md text-on-surface py-3 px-4 focus:ring-2 focus:ring-primary outline-none disabled:opacity-70" 
                placeholder="Notas u observaciones de la venta..." 
                disabled={isView}
              />
            </div>
          </div>

          {/* Section 2: Product Table */}
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary shrink-0">Partidas de la Venta</h3>
              <div className="flex items-center gap-3 flex-1 justify-end">
                <div className="relative max-w-sm w-full">
                  <span className="material-symbols-outlined absolute left-3 top-2 text-on-surface-variant text-sm">search</span>
                  <input 
                    type="text" 
                    className="w-full bg-surface-container-highest border-none rounded-md text-on-surface py-1.5 pl-9 pr-4 text-xs focus:ring-1 focus:ring-primary/50 outline-none" 
                    placeholder="Buscar producto..." 
                  />
                </div>
                {isView ? null : (
                  <button 
                    onClick={handleAddItem}
                    className="text-xs flex items-center gap-1.5 px-4 py-2 bg-surface-variant hover:bg-surface-bright text-primary rounded-md transition-all font-bold whitespace-nowrap shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span> Añadir Producto
                  </button>
                )}
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-lg border border-outline-variant/10">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-surface-container-high/50 text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/10">
                    <th className="px-4 py-3 font-semibold">Producto / Descripción</th>
                    <th className="px-4 py-3 font-semibold w-24">Cant.</th>
                    <th className="px-4 py-3 font-semibold w-40">Precio Unit.</th>
                    <th className="px-4 py-3 font-semibold w-40">Subtotal</th>
                    {!isView && <th className="px-4 py-3 font-semibold w-12 text-center"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {detalles.map(item => (
                    <tr key={item.id} className="group hover:bg-surface-container-highest/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="relative group/search">
                          <input 
                            type="text" 
                            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-on-surface outline-none disabled:opacity-70" 
                            value={item.productoNombre}
                            onChange={(e) => handleUpdateItem(item.id, 'productoNombre', e.target.value)}
                            placeholder="Nombre del producto..."
                            disabled={isView}
                          />
                          {!isView && <div className="absolute inset-x-0 -bottom-1 h-px bg-outline-variant/30 group-hover/search:bg-primary transition-all"></div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          min="1"
                          className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-on-surface text-center outline-none disabled:opacity-70" 
                          value={item.cantidad || ''}
                          onChange={(e) => handleUpdateItem(item.id, 'cantidad', parseFloat(e.target.value) || 0)}
                          disabled={isView}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-on-surface-variant text-xs">S/</span>
                          <input 
                            type="number" 
                            step="0.01"
                            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-on-surface outline-none disabled:opacity-70" 
                            value={item.precioUnitario || ''}
                            onChange={(e) => handleUpdateItem(item.id, 'precioUnitario', parseFloat(e.target.value) || 0)}
                            disabled={isView}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-on-surface">
                        S/ {(item.cantidad * item.precioUnitario).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      {!isView && (
                        <td className="px-4 py-3 text-center">
                          <button 
                            onClick={() => handeRemoveItem(item.id)}
                            className="text-on-surface-variant hover:text-error transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">delete_sweep</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {!isView && (
                    <tr className="bg-surface-container-highest/10">
                      <td className="px-4 py-3 italic text-on-surface-variant/50 text-xs">
                        Click en 'Añadir Producto' para agregar más filas...
                      </td>
                      <td className="px-4 py-3" colSpan={4}></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Financial Summary */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="max-w-xs space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>info</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Esta venta se registrará como Boleta Electrónica por defecto. Puede cambiar a Factura si el cliente cuenta con RUC.
                </p>
              </div>
            </div>
            
            <div className="w-full md:w-80 space-y-3 bg-surface-container-high/40 p-6 rounded-xl border border-outline-variant/10">
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">Subtotal</span>
                <span className="text-sm font-medium text-on-surface">
                  S/ {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">IGV (18%)</span>
                <span className="text-sm font-medium text-on-surface">
                  S/ {igv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="pt-3 mt-3 border-t border-outline-variant/20 flex justify-between items-center">
                <span className="text-base font-bold text-on-surface">Total General</span>
                <span className="text-xl font-extrabold text-primary tracking-tight">
                  S/ {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
          
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-6 bg-surface-container-highest/20 border-t border-outline-variant/15 flex flex-col sm:flex-row justify-end gap-4 shrink-0">
          <button 
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-8 py-3 text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 transition-colors rounded-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isView ? 'Cerrar' : 'Cancelar'}
          </button>
          {!isView && (
            <button 
              onClick={handleSaveWrapper}
              disabled={isSubmitting}
              className="px-10 py-3 text-sm font-bold bg-gradient-to-br from-primary-dim to-primary text-on-primary-container hover:shadow-[0_0_20px_rgba(77,124,254,0.4)] transition-all rounded-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
            >
              <span className={`material-symbols-outlined text-lg ${isSubmitting ? 'animate-spin' : ''}`}>
                {isSubmitting ? 'progress_activity' : 'check_circle'}
              </span>
              {isSubmitting ? 'Guardando...' : (mode === 'edit' ? 'Guardar Cambios' : 'Generar Venta')}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

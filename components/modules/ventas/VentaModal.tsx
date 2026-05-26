'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  VentaDB,
  VentaCreateInput,
  VentaUpdateInput,
  VentaDetalleInput,
  EstadoVenta,
  ClienteOption,
  ProductoVentaOption,
  getEstadoVentaLabel,
  getClienteDisplayName,
} from '@/lib/types/venta';
import {
  createVenta,
  updateVenta,
  generateCodigoVenta,
  getClientesActivos,
  getProductosVenta,
  getVentaById,
} from '@/app/ventas/actions';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DetalleRow extends VentaDetalleInput {
  _key: string; // local UI key
  producto_nombre: string;
  producto_sku?: string;
  stock_disponible?: number;
}

interface VentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  mode?: 'create' | 'edit' | 'view';
  venta?: VentaDB | null;
}

function makeKey() {
  return Math.random().toString(36).slice(2, 9);
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export function VentaModal({ isOpen, onClose, onSaved, mode = 'create', venta }: VentaModalProps) {
  const isView = mode === 'view';

  // ── Remote data
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [productos, setProductos] = useState<ProductoVentaOption[]>([]);
  const [showProductoDropdown, setShowProductoDropdown] = useState(false);
  const [activeRowKey, setActiveRowKey] = useState<string | null>(null);

  const productoSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Form state
  const [clienteId, setClienteId] = useState('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  const [estado, setEstado] = useState<EstadoVenta>('completado');
  const [codigoVenta, setCodigoVenta] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [detalles, setDetalles] = useState<DetalleRow[]>([]);

  // ── UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);

  // ── Calculations
  const subtotal = useMemo(
    () => detalles.reduce((acc, d) => acc + d.cantidad * d.precio_unitario, 0),
    [detalles],
  );
  const igv = useMemo(() => subtotal * 0.18, [subtotal]);
  const total = useMemo(() => subtotal + igv, [subtotal, igv]);

  const fmtSoles = (n: number) =>
    `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ── Load clientes + codigo_venta on open
  const init = useCallback(async () => {
    setLoadingInit(true);
    setFormError(null);

    const [clientesResult] = await Promise.all([getClientesActivos()]);
    setClientes(clientesResult.data);

    if (mode === 'create') {
      const codeResult = await generateCodigoVenta();
      setCodigoVenta(codeResult.data);
      setFechaEmision(new Date().toISOString().split('T')[0]);
      setClienteId('');
      setEstado('completado');
      setObservaciones('');
      setDetalles([]);
    } else if (venta) {
      // Load full venta with detalles
      const fullResult = await getVentaById(venta.id);
      const full = fullResult.data ?? venta;

      setCodigoVenta(full.codigo_venta);
      setClienteId(full.cliente_id);
      setFechaEmision(full.fecha_emision);
      setEstado(full.estado);
      setObservaciones(full.observaciones ?? '');

      if (full.venta_detalle && full.venta_detalle.length > 0) {
        setDetalles(
          full.venta_detalle.map((d) => ({
            _key: makeKey(),
            producto_id: d.producto_id,
            producto_nombre: d.productos?.nombre ?? d.producto_id,
            producto_sku: d.productos?.sku,
            cantidad: d.cantidad,
            precio_unitario: Number(d.precio_unitario),
          })),
        );
      } else {
        setDetalles([]);
      }
    }

    setLoadingInit(false);
  }, [mode, venta]);

  useEffect(() => {
    if (isOpen) {
      init();
    }
  }, [isOpen, init]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // ── Product search with debounce
  const handleProductoSearchChange = (key: string, value: string) => {
    setActiveRowKey(key);
    updateDetalle(key, 'producto_nombre', value);
    setShowProductoDropdown(true);

    if (productoSearchTimeout.current) clearTimeout(productoSearchTimeout.current);
    productoSearchTimeout.current = setTimeout(async () => {
      const result = await getProductosVenta(value);
      setProductos(result.data);
    }, 300);
  };

  const handleSelectProducto = (key: string, producto: ProductoVentaOption) => {
    setDetalles((prev) =>
      prev.map((d) =>
        d._key === key
          ? {
              ...d,
              producto_id:      producto.id,
              producto_nombre:  producto.nombre,
              producto_sku:     producto.sku,
              precio_unitario:  Number(producto.precio_venta),
              stock_disponible: producto.stock_actual,
            }
          : d,
      ),
    );
    setShowProductoDropdown(false);
    setActiveRowKey(null);
  };

  // ── Detalle row handlers
  const addDetalle = async () => {
    const result = await getProductosVenta('');
    setProductos(result.data);
    setDetalles((prev) => [
      ...prev,
      {
        _key: makeKey(),
        producto_id: '',
        producto_nombre: '',
        cantidad: 1,
        precio_unitario: 0,
      },
    ]);
  };

  const removeDetalle = (key: string) => {
    setDetalles((prev) => prev.filter((d) => d._key !== key));
  };

  const updateDetalle = (key: string, field: keyof DetalleRow, value: unknown) => {
    setDetalles((prev) =>
      prev.map((d) => (d._key === key ? { ...d, [field]: value } : d)),
    );
  };

  // ── Submit
  const handleSubmit = async () => {
    setFormError(null);

    if (!clienteId) { setFormError('Selecciona un cliente.'); return; }
    if (!fechaEmision) { setFormError('La fecha de emisión es requerida.'); return; }
    if (detalles.length === 0) { setFormError('Agrega al menos un producto.'); return; }
    for (const d of detalles) {
      if (!d.producto_id) { setFormError('Todos los productos deben estar seleccionados de la lista.'); return; }
      if (d.cantidad <= 0) { setFormError('La cantidad debe ser mayor a 0.'); return; }
      if (d.precio_unitario <= 0) { setFormError('El precio unitario debe ser mayor a 0.'); return; }
      // Client-side stock check
      if (d.stock_disponible !== undefined && d.cantidad > d.stock_disponible && estado === 'completado') {
        setFormError(`Stock insuficiente para "${d.producto_nombre}". Disponible: ${d.stock_disponible}`);
        return;
      }
    }

    setIsSubmitting(true);

    const detallesInput: VentaDetalleInput[] = detalles.map((d) => ({
      producto_id:     d.producto_id,
      cantidad:        d.cantidad,
      precio_unitario: d.precio_unitario,
    }));

    let result;
    if (mode === 'create') {
      const input: VentaCreateInput = {
        cliente_id:    clienteId,
        fecha_emision: fechaEmision,
        estado,
        codigo_venta:  codigoVenta,
        observaciones,
        detalles:      detallesInput,
      };
      result = await createVenta(input);
    } else if (mode === 'edit' && venta) {
      const input: VentaUpdateInput = {
        cliente_id:    clienteId,
        fecha_emision: fechaEmision,
        estado,
        observaciones,
        detalles:      detallesInput,
      };
      result = await updateVenta(venta.id, input);
    } else {
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);

    if (result?.error) {
      setFormError(result.error);
    } else {
      if (onSaved) await onSaved();
      onClose();
    }
  };

  // ── Helper: get display name for select option
  const getClienteOptionLabel = (c: ClienteOption) => {
    return getClienteDisplayName(c) + (c.documento ? ` — ${c.documento}` : '');
  };

  if (!isOpen) return null;

  return (
    <div style={{ zIndex: 10000 }} className="fixed inset-0 flex items-center justify-center bg-surface-container-lowest/80 backdrop-blur-md p-4 lg:p-8">
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
          <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 relative outline-none custom-scrollbar">

          {/* Loading overlay */}
          {loadingInit && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low/80 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
                <p className="text-sm font-medium">Cargando...</p>
              </div>
            </div>
          )}

          {/* Error banner */}
          {formError && (
            <div className="flex items-center gap-2 px-4 py-3 bg-error/10 border border-error/30 rounded-lg text-sm text-error">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              {formError}
            </div>
          )}
          
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
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                >
                  <option value="">Seleccione un cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{getClienteOptionLabel(c)}</option>
                  ))}
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
                  value={fechaEmision}
                  onChange={(e) => setFechaEmision(e.target.value)}
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
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoVenta)}
                >
                  <option value="completado">{getEstadoVentaLabel('completado')}</option>
                  <option value="pendiente">{getEstadoVentaLabel('pendiente')}</option>
                  <option value="anulado">{getEstadoVentaLabel('anulado')}</option>
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
                value={codigoVenta}
                readOnly
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">COMENTARIOS</label>
              <input 
                type="text" 
                className="w-full bg-surface-container-highest border-none rounded-md text-on-surface py-3 px-4 focus:ring-2 focus:ring-primary outline-none disabled:opacity-70" 
                placeholder="Notas u observaciones de la venta..." 
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                disabled={isView}
              />
            </div>
          </div>

          {/* Section 2: Product Table */}
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary shrink-0">Partidas de la Venta</h3>
              {!isView && (
                <button 
                  onClick={addDetalle}
                  className="text-xs flex items-center gap-1.5 px-4 py-2 bg-surface-variant hover:bg-surface-bright text-primary rounded-md transition-all font-bold whitespace-nowrap shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span> Añadir Producto
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto rounded-lg border border-outline-variant/10">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-surface-container-high/50 text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/10">
                    <th className="px-4 py-3 font-semibold">Producto / Descripción</th>
                    <th className="px-4 py-3 font-semibold w-20">Stock</th>
                    <th className="px-4 py-3 font-semibold w-24">Cant.</th>
                    <th className="px-4 py-3 font-semibold w-40">Precio Unit.</th>
                    <th className="px-4 py-3 font-semibold w-40">Subtotal</th>
                    {!isView && <th className="px-4 py-3 font-semibold w-12 text-center"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {detalles.map(item => (
                    <tr key={item._key} className="group hover:bg-surface-container-highest/30 transition-colors">
                      {/* Producto selector */}
                      <td className="px-4 py-3">
                        <div className="relative">
                          <div className={`relative ${!isView ? 'bg-surface-container-highest rounded-md' : 'bg-transparent'}`}>
                            <input
                              type="text"
                              className={`w-full border-none text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none disabled:opacity-70 ${!isView ? 'bg-transparent py-2.5 pl-4 pr-10 rounded-md placeholder-on-surface-variant/50' : 'bg-transparent p-0'}`}
                              value={item.producto_nombre}
                              onChange={(e) => handleProductoSearchChange(item._key, e.target.value)}
                              onFocus={async () => {
                                setActiveRowKey(item._key);
                                setShowProductoDropdown(true);
                                const result = await getProductosVenta(item.producto_nombre);
                                setProductos(result.data);
                              }}
                              onBlur={() => {
                                setTimeout(() => setShowProductoDropdown(false), 200);
                              }}
                              placeholder="Buscar producto por nombre o SKU..."
                              disabled={isView}
                            />
                            {!isView && (
                              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 pointer-events-none text-[20px]">
                                expand_more
                              </span>
                            )}
                          </div>

                          {/* Dropdown */}
                          {showProductoDropdown && activeRowKey === item._key && productos.length > 0 && (
                            <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-[120%] min-w-[350px] bg-surface-container-highest border border-outline-variant/20 rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.6)] py-1 overflow-hidden">
                              {productos.slice(0, 8).map((p) => {
                                const noStock = p.stock_actual <= 0;
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    className={`w-full text-left px-4 py-2.5 transition-colors flex items-center justify-between gap-3 group ${noStock ? 'opacity-40 cursor-not-allowed' : 'hover:bg-primary/10'}`}
                                    onClick={() => !noStock && handleSelectProducto(item._key, p)}
                                    disabled={noStock}
                                  >
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-on-surface truncate group-hover:text-primary transition-colors">{p.nombre}</p>
                                      <p className="text-xs text-on-surface-variant group-hover:text-primary/70 transition-colors font-mono">{p.sku}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="text-xs font-bold text-primary">S/ {Number(p.precio_venta).toFixed(2)}</p>
                                      <p className={`text-[10px] ${noStock ? 'text-error font-bold' : 'text-on-surface-variant'}`}>
                                        {noStock ? 'Sin stock' : `Stock: ${p.stock_actual}`}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        {item.producto_sku && (
                          <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">{item.producto_sku}</p>
                        )}
                      </td>

                      {/* Stock indicator */}
                      <td className="px-4 py-3 text-center">
                        {item.stock_disponible !== undefined ? (
                          <span className={`text-xs font-bold ${item.stock_disponible <= 0 ? 'text-error' : item.cantidad > item.stock_disponible ? 'text-error' : 'text-on-surface-variant'}`}>
                            {item.stock_disponible}
                          </span>
                        ) : (
                          <span className="text-xs text-on-surface-variant/30">—</span>
                        )}
                      </td>

                      {/* Cantidad */}
                      <td className="px-4 py-3">
                        <input 
                          type="number" 
                          min="1"
                          className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-on-surface text-center outline-none disabled:opacity-70" 
                          value={item.cantidad || ''}
                          onChange={(e) => updateDetalle(item._key, 'cantidad', parseInt(e.target.value) || 0)}
                          disabled={isView}
                        />
                        {item.stock_disponible !== undefined && item.cantidad > item.stock_disponible && estado === 'completado' && (
                          <p className="text-[9px] text-error text-center mt-0.5">Excede stock</p>
                        )}
                      </td>

                      {/* Precio unitario */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-on-surface-variant text-xs">S/</span>
                          <input 
                            type="number" 
                            step="0.01"
                            min="0"
                            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-on-surface outline-none disabled:opacity-70" 
                            value={item.precio_unitario || ''}
                            onChange={(e) => updateDetalle(item._key, 'precio_unitario', parseFloat(e.target.value) || 0)}
                            disabled={isView}
                          />
                        </div>
                      </td>

                      {/* Subtotal */}
                      <td className="px-4 py-3 text-sm font-bold text-on-surface">
                        S/ {(item.cantidad * item.precio_unitario).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Delete */}
                      {!isView && (
                        <td className="px-4 py-3 text-center">
                          <button 
                            onClick={() => removeDetalle(item._key)}
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
                        Click en &apos;Añadir Producto&apos; para agregar más filas...
                      </td>
                      <td className="px-4 py-3" colSpan={5}></td>
                    </tr>
                  )}
                  {detalles.length === 0 && isView && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant/50 text-sm italic">
                        Sin partidas registradas
                      </td>
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
                  El stock se descontará automáticamente cuando el estado sea{' '}
                  <span className="text-primary font-bold">Completado</span>. Si se anula, el stock será devuelto.
                </p>
              </div>
            </div>
            
            <div className="w-full md:w-80 space-y-3 bg-surface-container-high/40 p-6 rounded-xl border border-outline-variant/10">
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">Subtotal</span>
                <span className="text-sm font-medium text-on-surface">{fmtSoles(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">IGV (18%)</span>
                <span className="text-sm font-medium text-on-surface">{fmtSoles(igv)}</span>
              </div>
              <div className="pt-3 mt-3 border-t border-outline-variant/20 flex justify-between items-center">
                <span className="text-base font-bold text-on-surface">Total General</span>
                <span className="text-xl font-extrabold text-primary tracking-tight">{fmtSoles(total)}</span>
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
              onClick={handleSubmit}
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

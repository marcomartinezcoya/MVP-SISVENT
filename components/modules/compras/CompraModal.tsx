'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  CompraDB,
  CompraCreateInput,
  CompraUpdateInput,
  CompraDetalleInput,
  EstadoCompra,
  getEstadoLabel,
  ProductoOption,
  ProveedorOption,
} from '@/lib/types/compra';
import {
  createCompra,
  updateCompra,
  generateNumeroOrden,
  getProveedoresActivos,
  getProductosActivos,
  getCompraById,
} from '@/app/compras/actions';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DetalleRow extends CompraDetalleInput {
  _key: string; // local UI key
  producto_nombre: string;
  producto_sku?: string;
}

interface CompraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void; // called after successful save to refresh parent
  mode?: 'create' | 'edit' | 'view';
  compra?: CompraDB | null;
}

function makeKey() {
  return Math.random().toString(36).slice(2, 9);
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export function CompraModal({ isOpen, onClose, onSaved, mode = 'create', compra }: CompraModalProps) {
  const isView = mode === 'view';

  // ── Remote data
  const [proveedores, setProveedores] = useState<ProveedorOption[]>([]);
  const [productos, setProductos] = useState<ProductoOption[]>([]);
  const [productoSearch, setProductoSearch] = useState('');
  const [showProductoDropdown, setShowProductoDropdown] = useState(false);
  const [activeRowKey, setActiveRowKey] = useState<string | null>(null);

  const productoSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Form state
  const [proveedorId, setProveedorId] = useState('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  const [estado, setEstado] = useState<EstadoCompra>('pendiente');
  const [numeroOrden, setNumeroOrden] = useState('');
  const [comentarios, setComentarios] = useState('');
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

  // ── Load proveedores + numero_orden on open
  const init = useCallback(async () => {
    setLoadingInit(true);
    setFormError(null);

    const [provResult] = await Promise.all([getProveedoresActivos()]);
    setProveedores(provResult.data);

    if (mode === 'create') {
      const numResult = await generateNumeroOrden();
      setNumeroOrden(numResult.data);
      setFechaEmision(new Date().toISOString().split('T')[0]);
      setProveedorId('');
      setEstado('pendiente');
      setComentarios('');
      setDetalles([]);
    } else if (compra) {
      // Load full compra with detalles
      const fullResult = await getCompraById(compra.id);
      const full = fullResult.data ?? compra;

      setNumeroOrden(full.numero_orden);
      setProveedorId(full.proveedor_id);
      setFechaEmision(full.fecha_emision);
      setEstado(full.estado);
      setComentarios(full.comentarios ?? '');

      if (full.compra_detalle && full.compra_detalle.length > 0) {
        setDetalles(
          full.compra_detalle.map((d) => ({
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
  }, [mode, compra]);

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
    setProductoSearch(value);
    updateDetalle(key, 'producto_nombre', value);
    setShowProductoDropdown(true);

    if (productoSearchTimeout.current) clearTimeout(productoSearchTimeout.current);
    productoSearchTimeout.current = setTimeout(async () => {
      const result = await getProductosActivos(value);
      setProductos(result.data);
    }, 300);
  };

  const handleSelectProducto = (key: string, producto: ProductoOption) => {
    setDetalles((prev) =>
      prev.map((d) =>
        d._key === key
          ? {
              ...d,
              producto_id:     producto.id,
              producto_nombre: producto.nombre,
              producto_sku:    producto.sku,
              precio_unitario: Number(producto.precio_compra),
            }
          : d,
      ),
    );
    setShowProductoDropdown(false);
    setProductoSearch('');
    setActiveRowKey(null);
  };

  // ── Detalle row handlers
  const addDetalle = async () => {
    const result = await getProductosActivos('');
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

    if (!proveedorId) { setFormError('Selecciona un proveedor.'); return; }
    if (!fechaEmision) { setFormError('La fecha de emisión es requerida.'); return; }
    if (detalles.length === 0) { setFormError('Agrega al menos un producto.'); return; }
    for (const d of detalles) {
      if (!d.producto_id) { setFormError('Todos los productos deben estar seleccionados de la lista.'); return; }
      if (d.cantidad <= 0) { setFormError('La cantidad debe ser mayor a 0.'); return; }
    }

    setIsSubmitting(true);

    const detallesInput: CompraDetalleInput[] = detalles.map((d) => ({
      producto_id:     d.producto_id,
      cantidad:        d.cantidad,
      precio_unitario: d.precio_unitario,
    }));

    let result;
    if (mode === 'create') {
      const input: CompraCreateInput = {
        proveedor_id:  proveedorId,
        fecha_emision: fechaEmision,
        estado,
        numero_orden:  numeroOrden,
        comentarios,
        detalles:      detallesInput,
      };
      result = await createCompra(input);
    } else if (mode === 'edit' && compra) {
      const input: CompraUpdateInput = {
        proveedor_id:  proveedorId,
        fecha_emision: fechaEmision,
        estado,
        comentarios,
        detalles:      detallesInput,
      };
      result = await updateCompra(compra.id, input);
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

  if (!isOpen) return null;

  return (
    <div style={{ zIndex: 10000 }} className="fixed inset-0 flex items-center justify-center bg-surface-container-lowest/80 backdrop-blur-md p-4 lg:p-8">
      {/* MODAL CONTAINER */}
      <div className="w-full max-w-5xl bg-surface-container-low rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-outline-variant/20">

        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-outline-variant/15 flex justify-between items-center bg-surface-container-high/30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container shadow-[0_0_20px_rgba(193,128,255,0.2)]">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>shopping_bag</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface tracking-tight">
                {mode === 'create' ? 'Nueva Orden de Compra' : mode === 'edit' ? 'Editar Orden de Compra' : 'Detalle de Orden de Compra'}
              </h2>
              <p className="text-sm text-on-surface-variant">
                {isView ? 'Visualizando los detalles de la adquisición.' : 'Complete los detalles para procesar la adquisición.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 relative">

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
            {/* Proveedor */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Proveedor <span className="text-error">*</span>
              </label>
              <div className="relative group">
                <select
                  className="w-full bg-surface-container-highest border-none rounded-md text-on-surface py-3 px-4 focus:ring-2 focus:ring-primary appearance-none cursor-pointer outline-none disabled:opacity-70"
                  disabled={isView}
                  value={proveedorId}
                  onChange={(e) => setProveedorId(e.target.value)}
                >
                  <option value="">Seleccione un proveedor...</option>
                  {proveedores.map((prov) => (
                    <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                  ))}
                </select>
                {!isView && <span className="material-symbols-outlined absolute right-4 top-3 text-on-surface-variant pointer-events-none group-hover:text-primary transition-colors">expand_more</span>}
              </div>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Fecha de Emisión <span className="text-error">*</span>
              </label>
              <input
                type="date"
                className="w-full bg-surface-container-highest border-none rounded-md text-on-surface py-3 px-4 focus:ring-2 focus:ring-primary outline-none disabled:opacity-70"
                style={{ colorScheme: 'dark' }}
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
                disabled={isView}
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Estado <span className="text-error">*</span>
              </label>
              <div className="relative group">
                <select
                  className="w-full bg-surface-container-highest border-none rounded-md text-on-surface py-3 px-4 focus:ring-2 focus:ring-primary appearance-none cursor-pointer outline-none disabled:opacity-70"
                  disabled={isView}
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoCompra)}
                >
                  <option value="pendiente">{getEstadoLabel('pendiente')}</option>
                  <option value="recibido">{getEstadoLabel('recibido')}</option>
                  <option value="cancelado">{getEstadoLabel('cancelado')}</option>
                </select>
                {!isView && <span className="material-symbols-outlined absolute right-4 top-3 text-on-surface-variant pointer-events-none">expand_more</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Numero Orden */}
            <div className="md:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Nº de Orden <span className="text-error">*</span>
              </label>
              <input
                type="text"
                className="w-full bg-surface-container-highest border-none rounded-md text-primary font-bold py-3 px-4 focus:ring-2 focus:ring-primary outline-none disabled:opacity-70"
                value={numeroOrden}
                onChange={(e) => setNumeroOrden(e.target.value)}
                disabled={isView}
                readOnly={mode === 'edit'}
              />
            </div>
            {/* Comentarios */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Comentarios</label>
              <input
                type="text"
                className="w-full bg-surface-container-highest border-none rounded-md text-on-surface py-3 px-4 focus:ring-2 focus:ring-primary outline-none disabled:opacity-70"
                placeholder="Referencia de proyecto o comentarios adicionales..."
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                disabled={isView}
              />
            </div>
          </div>

          {/* Section 2: Product Table */}
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary shrink-0">Partidas de la Orden</h3>
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
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-surface-container-high/50 text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/10">
                    <th className="px-4 py-3 font-semibold">Producto / Descripción</th>
                    <th className="px-4 py-3 font-semibold w-24">Cant.</th>
                    <th className="px-4 py-3 font-semibold w-40">Precio Unit.</th>
                    <th className="px-4 py-3 font-semibold w-40">Subtotal</th>
                    {!isView && <th className="px-4 py-3 font-semibold w-12 text-center" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {detalles.map((item) => (
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
                                const result = await getProductosActivos(item.producto_nombre);
                                setProductos(result.data);
                              }}
                              onBlur={() => {
                                // Delay to allow click on dropdown
                                setTimeout(() => setShowProductoDropdown(false), 200);
                              }}
                              placeholder="Buscar producto por nombre..."
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
                            <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-[120%] min-w-[320px] bg-surface-container-highest border border-outline-variant/20 rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.6)] py-1 overflow-hidden">
                              {productos.slice(0, 8).map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  className="w-full text-left px-4 py-2.5 hover:bg-primary/10 transition-colors flex items-center justify-between gap-3 group"
                                  onClick={() => handleSelectProducto(item._key, p)}
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-on-surface truncate group-hover:text-primary transition-colors">{p.nombre}</p>
                                    <p className="text-xs text-on-surface-variant group-hover:text-primary/70 transition-colors font-mono">{p.sku}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-xs font-bold text-primary">S/ {Number(p.precio_compra).toFixed(2)}</p>
                                    <p className="text-[10px] text-on-surface-variant group-hover:text-primary/70 transition-colors">Stock: {p.stock_actual}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {item.producto_sku && (
                          <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">{item.producto_sku}</p>
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
                      <td className="px-4 py-3" colSpan={4} />
                    </tr>
                  )}
                  {detalles.length === 0 && isView && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-on-surface-variant/50 text-sm italic">
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
              <div className="flex items-center gap-3 p-4 rounded-lg bg-tertiary-container/5 border border-tertiary/10">
                <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: '"FILL" 1' }}>info</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  El stock se actualizará automáticamente cuando el estado cambie a{' '}
                  <span className="text-tertiary font-bold">Recibido</span>.
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
                <span className="text-xl font-extrabold text-secondary tracking-tight">{fmtSoles(total)}</span>
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
              className="px-10 py-3 text-sm font-bold bg-gradient-to-br from-primary-dim to-primary text-on-primary-container hover:shadow-[0_0_20px_rgba(125,156,255,0.4)] transition-all rounded-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
            >
              <span className={`material-symbols-outlined text-lg ${isSubmitting ? 'animate-spin' : ''}`}>
                {isSubmitting ? 'progress_activity' : 'save'}
              </span>
              {isSubmitting ? 'Guardando...' : mode === 'edit' ? 'Guardar Cambios' : 'Guardar Orden'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

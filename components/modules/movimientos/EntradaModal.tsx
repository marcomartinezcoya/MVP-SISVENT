'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import {
  ProductoMovimientoOption,
  TipoMovimiento,
  getTipoMovimientoLabel,
  getTipoMovimientoStyle,
} from '@/lib/types/movimiento';
import {
  createMovimiento,
  getProductosMovimiento,
  generateCodigoMovimiento,
} from '@/app/movimientos/actions';
import { getProveedoresActivos } from '@/app/compras/actions';
import { ProveedorOption } from '@/lib/types/compra';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EntradaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const MOTIVOS_SUGERIDOS = [
  'Reposición de stock',
  'Compra de mercancía',
  'Devolución de cliente',
  'Corrección de saldo',
  'Merma / Daño',
  'Ajuste manual',
  'Transferencia interna',
];

const TIPOS: TipoMovimiento[] = ['ENTRADA', 'SALIDA', 'AJUSTE', 'TRANSFERENCIA'];

// ── Component ─────────────────────────────────────────────────────────────────

export const EntradaModal: React.FC<EntradaModalProps> = ({ isOpen, onClose, onSaved }) => {
  // ── Remote data
  const [productos, setProductos] = useState<ProductoMovimientoOption[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Form state
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento>('ENTRADA');
  const [productoSearch, setProductoSearch] = useState('');
  const [selectedProducto, setSelectedProducto] = useState<ProductoMovimientoOption | null>(null);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [referencia, setReferencia] = useState('');
  const [codigoPreview, setCodigoPreview] = useState('MOV-######');
  const [ajusteSigno, setAjusteSigno] = useState<'positivo' | 'negativo'>('negativo');

  // ── UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loadingInit, setLoadingInit] = useState(false);

  // ── Derived
  const costoUnitario = selectedProducto?.precio_compra ?? 0;
  const cantidadNum = parseInt(cantidad || '0', 10) || 0;
  const valorTotal = Math.abs(cantidadNum) * Math.abs(costoUnitario);
  const tipoStyle = getTipoMovimientoStyle(tipoMovimiento);

  const fmtSoles = (n: number) =>
    `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ── Init on open
  const init = useCallback(async () => {
    setLoadingInit(true);
    setFormError(null);
    setProductoSearch('');
    setSelectedProducto(null);
    setCantidad('');
    setMotivo('');
    setOrigen('');
    setDestino('');
    setReferencia('');
    setTipoMovimiento('ENTRADA');
    setAjusteSigno('negativo');
    setFecha(new Date().toISOString().split('T')[0]);

    const [prodResult, codeResult, provResult] = await Promise.all([
      getProductosMovimiento(''),
      generateCodigoMovimiento(),
      getProveedoresActivos(),
    ]);
    setProductos(prodResult.data);
    setCodigoPreview(codeResult.data);
    setProveedores(provResult.data || []);
    setLoadingInit(false);
  }, []);

  useEffect(() => {
    if (isOpen) init();
  }, [isOpen, init]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // ── Product search with debounce
  const handleProductoSearch = (value: string) => {
    setProductoSearch(value);
    setSelectedProducto(null);
    setShowDropdown(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      const result = await getProductosMovimiento(value);
      setProductos(result.data);
    }, 280);
  };

  const handleSelectProducto = (p: ProductoMovimientoOption) => {
    setSelectedProducto(p);
    setProductoSearch(`${p.nombre} (${p.sku})`);
    setShowDropdown(false);
  };

  // ── Submit
  const handleSubmit = async () => {
    setFormError(null);

    if (!selectedProducto) { setFormError('Selecciona un producto de la lista.'); return; }
    if (!cantidadNum) { setFormError('La cantidad no puede ser cero.'); return; }
    if (!motivo.trim()) { setFormError('El motivo es obligatorio.'); return; }

    // Client-side stock check for SALIDA
    if (tipoMovimiento === 'SALIDA') {
      const requerido = Math.abs(cantidadNum);
      if (selectedProducto.stock_actual < requerido) {
        setFormError(`Stock insuficiente. Disponible: ${selectedProducto.stock_actual} — Solicitado: ${requerido}`);
        return;
      }
    }

    // Client-side stock check for AJUSTE negativo
    if (tipoMovimiento === 'AJUSTE' && ajusteSigno === 'negativo') {
      const requerido = Math.abs(cantidadNum);
      if (selectedProducto.stock_actual < requerido) {
        setFormError(`Stock insuficiente para este ajuste. Disponible: ${selectedProducto.stock_actual} — Ajuste solicitado: ${requerido}`);
        return;
      }
    }

    setIsSubmitting(true);

    // Compute signed quantity
    let cantidadFinal: number;
    if (tipoMovimiento === 'SALIDA') {
      cantidadFinal = -Math.abs(cantidadNum);
    } else if (tipoMovimiento === 'AJUSTE') {
      cantidadFinal = ajusteSigno === 'negativo' ? -Math.abs(cantidadNum) : Math.abs(cantidadNum);
    } else {
      cantidadFinal = Math.abs(cantidadNum);
    }

    const result = await createMovimiento({
      producto_id:     selectedProducto.id,
      tipo_movimiento: tipoMovimiento,
      origen:          origen.trim() || (tipoMovimiento === 'ENTRADA' ? 'Proveedor' : 'Almacén Principal'),
      destino:         destino.trim() || (tipoMovimiento === 'SALIDA' ? 'Cliente' : 'Almacén Principal'),
      referencia:      referencia.trim() || undefined,
      motivo,
      cantidad:        cantidadFinal,
      costo_unitario:  costoUnitario,
      fecha_registro:  new Date(fecha).toISOString(),
    });

    setIsSubmitting(false);

    if (result.error) {
      setFormError(result.error);
    } else {
      if (onSaved) await onSaved();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Movimiento"
      maxWidth="max-w-2xl"
      icon="sync_alt"
      iconBgClass="bg-primary/10"
      iconTextClass="text-primary"
    >
      <div className="flex flex-col relative">
        {/* Scrollable body */}
        <div className="space-y-5 relative max-h-[60vh] overflow-y-auto pr-3 -mr-3 pb-2 custom-scrollbar">
          {/* Loading overlay fixed inside relative parent */}
        {loadingInit && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low/80 backdrop-blur-sm z-10 rounded-lg">
            <div className="flex flex-col items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
              <p className="text-sm font-medium">Preparando...</p>
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

        {/* Codigo preview */}
        <div className="flex items-center justify-between p-3 bg-surface-container rounded-lg border border-outline-variant/10">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Código</span>
          <span className="text-sm font-bold text-primary font-mono">{codigoPreview}</span>
        </div>

        {/* Tipo de Movimiento */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Tipo de Movimiento <span className="text-error">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TIPOS.map((tipo) => {
              const s = getTipoMovimientoStyle(tipo);
              const isActive = tipoMovimiento === tipo;
              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoMovimiento(tipo)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-bold transition-all ${
                    isActive
                      ? `${s.bg} ${s.text} border-current`
                      : 'border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/40'
                  }`}
                >
                  <span className={`material-symbols-outlined text-xl ${isActive ? s.text : ''}`}
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                    {s.icon}
                  </span>
                  {getTipoMovimientoLabel(tipo)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Producto + Fecha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Buscador de producto */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              Producto <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none placeholder:text-on-surface-variant/50"
                placeholder="Buscar por nombre o SKU..."
                value={productoSearch}
                onChange={(e) => handleProductoSearch(e.target.value)}
                onFocus={async () => {
                  setShowDropdown(true);
                  if (productos.length === 0) {
                    const r = await getProductosMovimiento('');
                    setProductos(r.data);
                  }
                }}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              />
              {showDropdown && productos.length > 0 && (
                <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-full bg-surface-container-highest border border-outline-variant/20 rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.6)] py-1 max-h-52 overflow-y-auto">
                  {productos.slice(0, 10).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={() => handleSelectProducto(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-primary/10 flex items-center justify-between gap-3 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate group-hover:text-primary">{p.nombre}</p>
                        <p className="text-xs text-on-surface-variant font-mono">{p.sku}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-primary">{fmtSoles(p.precio_compra ?? 0)}</p>
                        <p className={`text-[10px] ${p.stock_actual <= 0 ? 'text-error font-bold' : 'text-on-surface-variant'}`}>
                          Stock: {p.stock_actual}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedProducto && (
              <div className="flex items-center gap-2 mt-1 text-xs text-on-surface-variant">
                <span className={`w-1.5 h-1.5 rounded-full ${tipoStyle.dot}`}></span>
                Stock disponible: <span className={`font-bold ${selectedProducto.stock_actual <= 3 ? 'text-error' : 'text-on-surface'}`}>
                  {selectedProducto.stock_actual} unid.
                </span>
              </div>
            )}
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              Fecha de Registro <span className="text-error">*</span>
            </label>
            <input
              type="date"
              className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none [color-scheme:dark]"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>

        {/* Cantidad + Preview financiero */}
        <div className="bg-surface-container-highest/20 p-5 rounded-lg border border-outline-variant/10">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Cantidad */}
            <div className="w-full md:w-1/2 space-y-2">
              <label className="text-sm font-medium text-on-surface-variant">
                Cantidad <span className="text-error">*</span>
              </label>
              <input
                type="number"
                step="1"
                className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-3 text-2xl font-bold text-on-surface focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all outline-none text-center placeholder:text-outline-variant/50"
                placeholder="0"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
              {tipoMovimiento === 'AJUSTE' ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-medium">
                    Tipo de Ajuste
                  </p>
                  <div className="flex gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => setAjusteSigno('positivo')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all ${
                        ajusteSigno === 'positivo'
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400'
                          : 'border-outline-variant/20 text-on-surface-variant hover:border-emerald-500/30'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      Incremento (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAjusteSigno('negativo')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all ${
                        ajusteSigno === 'negativo'
                          ? 'bg-red-500/20 border-red-500/60 text-red-400'
                          : 'border-outline-variant/20 text-on-surface-variant hover:border-red-500/30'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">remove_circle</span>
                      Descuento (−)
                    </button>
                  </div>
                  {cantidadNum > 0 && selectedProducto && (
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${ajusteSigno === 'negativo' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {selectedProducto.stock_actual} →{' '}
                      {ajusteSigno === 'negativo'
                        ? Math.max(0, selectedProducto.stock_actual - cantidadNum)
                        : selectedProducto.stock_actual + cantidadNum}{' '}
                      unid.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-medium">
                  {tipoMovimiento === 'SALIDA' ? 'Unidades a descontar del stock' : 'Unidades a ingresar al stock'}
                </p>
              )}
            </div>

            {/* Preview financiero */}
            <div className={`w-full md:w-1/2 bg-surface-container rounded-lg p-5 border-l-4 ${tipoStyle.dot.replace('bg-', 'border-')} space-y-3`}>
              <div className="flex justify-between items-center">
                <span className="text-xs text-on-surface-variant font-medium">Costo Unitario</span>
                <span className="text-sm font-bold text-on-surface">{fmtSoles(costoUnitario)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-outline-variant/20">
                <span className="text-xs text-on-surface-variant font-medium">Valor Total Ajuste</span>
                <span className={`text-lg font-extrabold ${tipoStyle.text}`}>{fmtSoles(valorTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Origen / Destino */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">Origen</label>
            {tipoMovimiento === 'ENTRADA' ? (
              <select
                className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none appearance-none"
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
              >
                <option value="">Seleccione Proveedor...</option>
                {proveedores.map(p => (
                  <option key={p.id} value={p.nombre}>{p.nombre}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none placeholder:text-on-surface-variant/50"
                placeholder="Almacén Principal u otro..."
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
              />
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">Destino</label>
            <input
              type="text"
              className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none placeholder:text-on-surface-variant/50"
              placeholder={tipoMovimiento === 'SALIDA' ? 'Ej: Cliente XYZ' : 'Almacén Principal'}
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
            />
          </div>
        </div>

        {/* Referencia */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-on-surface-variant">Referencia (opcional)</label>
          <input
            type="text"
            className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none placeholder:text-on-surface-variant/50"
            placeholder="Ej: ORD-2024-001, SL-000005..."
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
          />
        </div>

        {/* Motivo */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-on-surface-variant">
            Motivo <span className="text-error">*</span>
          </label>
          <textarea
            className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none placeholder:text-on-surface-variant/50 resize-none"
            placeholder="Describa el motivo del movimiento..."
            rows={2}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          <div className="flex flex-wrap gap-2 pt-1">
            {MOTIVOS_SUGERIDOS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMotivo(m)}
                className="px-3 py-1 bg-surface-container hover:bg-surface-variant/50 rounded-full text-xs font-medium text-on-surface-variant hover:text-primary transition-all"
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        </div>

        {/* Sticky Actions Footer */}
        <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-outline-variant/10 bg-surface-container">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 border border-outline-variant/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || loadingInit}
            className="min-w-[160px] flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg bg-gradient-to-br from-primary-dim to-primary text-on-primary-container hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            {isSubmitting ? (
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            )}
            {isSubmitting ? 'Guardando...' : 'Confirmar Movimiento'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Producto,
  ProductoStats,
  ProductoCreateInput,
  ProductoUpdateInput,
  calcularEstadoStock,
  calcularPorcentajeStock,
} from '@/lib/types/producto';
import { formatSoles, formatSolesCompact } from '@/lib/utils/currency';
import {
  getProductosPage,
  getProductoStats,
  createProducto,
  updateProducto,
  deactivateProducto,
} from './actions';
import { ProductFormModal } from '@/components/modules/productos/ProductFormModal';

const CATEGORIAS = ['Electrónica', 'Accesorios', 'Oficina', 'Redes'];
const LIMIT = 10;

export default function ProductosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);

  const [productos, setProductos] = useState<Producto[]>([]);
  const [stats, setStats] = useState<ProductoStats>({
    totalSKUs: 0,
    totalValue: 0,
    criticalAlerts: 0,
    lowStockItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didMount = useRef(false);

  // ── Data fetching ─────────────────────────────────────────────────
  // Una sola Server Action que paraleliza productos + stats en la DB.
  const fetchPage = useCallback(
    async (currentPage: number, currentSearch: string, currentCategoria: string) => {
      setLoading(true);
      const result = await getProductosPage({
        page: currentPage,
        limit: LIMIT,
        search: currentSearch,
        categoria: currentCategoria,
      });
      if (!result.error) {
        setProductos(result.data.productos.data);
        setTotal(result.data.productos.total);
        setStats(result.data.stats);
      }
      setLoading(false);
    },
    [],
  );

  // Stats-only refresh (post-edición optimista)
  const fetchStats = useCallback(async () => {
    const result = await getProductoStats();
    if (!result.error) setStats(result.data);
  }, []);

  // ── Initial load ─────────────────────────────────────────────────
  useEffect(() => {
    fetchPage(1, '', '').then(() => {
      didMount.current = true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      setSearch(value);
      fetchPage(1, value, categoria);
    }, 400);
  };

  const handleCategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPage(1);
    const val = e.target.value;
    const newCat = CATEGORIAS.includes(val) ? val : '';
    setCategoria(newCat);
    fetchPage(1, search, newCat);
  };

  const handleOpenNewProduct = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditProduct = (product: Producto) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleSave = async (
    data: ProductoCreateInput | ProductoUpdateInput,
    mode: 'create' | 'edit',
  ): Promise<{ success: boolean; error?: string }> => {
    if (mode === 'edit' && selectedProduct) {
      const result = await updateProducto(selectedProduct.id, data as ProductoUpdateInput);
      if (result.error) return { success: false, error: result.error };
      
      if (result.data) {
        const updated = result.data;
        setProductos((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p)),
        );
      }
      fetchStats();
      return { success: true };
    } else {
      const result = await createProducto(data as ProductoCreateInput);
      if (result.error) return { success: false, error: result.error };
      
      await fetchPage(page, search, categoria);
      return { success: true };
    }
  };

  const handleDeactivate = async (id: string) => {
    const result = await deactivateProducto(id);
    if (!result.error) {
      await fetchPage(page, search, categoria);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const fromItem = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const toItem = Math.min(page * LIMIT, total);

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoria) params.set('categoria', categoria);
      const url = `/api/productos/export${params.toString() ? `?${params}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al generar el archivo');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const cd = res.headers.get('Content-Disposition') ?? '';
      const match = cd.match(/filename="([^"]+)"/);
      link.download = match?.[1] ?? 'productos.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al exportar');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-3xl font-extrabold tracking-tight text-on-surface mb-1">Gestión de Productos</h3>
          <p className="text-on-surface-variant font-medium">Visualización completa del inventario y control de stock</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting || loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-surface-variant text-primary font-semibold rounded-md border border-primary/20 hover:bg-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={search || categoria ? 'Exportar resultados filtrados' : 'Exportar todos los productos'}
          >
            <span className="material-symbols-outlined text-xl">
              {isExporting ? 'hourglass_top' : 'download'}
            </span>
            {isExporting ? 'Exportando…' : 'Exportar'}
          </button>
          <button
            onClick={handleOpenNewProduct}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary-dim to-primary text-on-primary-container font-bold rounded-md shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SKUs */}
        <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10 flex flex-col gap-4 relative overflow-hidden group">
          <div className="flex items-center justify-between z-10">
            <span className="text-on-surface-variant font-semibold text-sm uppercase tracking-wider">Total SKUs</span>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>inventory</span>
            </div>
          </div>
          <div className="z-10">
            <p className="text-4xl font-extrabold text-on-surface tracking-tighter">{stats.totalSKUs.toLocaleString()}</p>
            <p className="text-xs text-tertiary-fixed-dim mt-1 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span> +12% este mes
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
        </div>

        {/* Valor de Inventario */}
        <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10 flex flex-col gap-4 relative overflow-hidden group">
          <div className="flex items-center justify-between z-10">
            <span className="text-on-surface-variant font-semibold text-sm uppercase tracking-wider">Valor Total</span>
            <div className="p-2 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            </div>
          </div>
          <div className="z-10">
            <p className="text-4xl font-extrabold text-on-surface tracking-tighter">{formatSolesCompact(stats.totalValue)}</p>
            <p className="text-xs text-on-surface-variant mt-1 font-medium">Basado en costo unitario</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-secondary/5 rounded-full blur-2xl"></div>
        </div>

        {/* Alertas Críticas */}
        <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10 flex flex-col gap-4 relative overflow-hidden group">
          <div className="flex items-center justify-between z-10">
            <span className="text-on-surface-variant font-semibold text-sm uppercase tracking-wider">Alertas Críticas</span>
            <div className="p-2 bg-error/10 rounded-lg group-hover:bg-error/20 transition-colors">
              <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>report</span>
            </div>
          </div>
          <div className="z-10">
            <p className="text-4xl font-extrabold text-on-surface tracking-tighter">{stats.criticalAlerts}</p>
            <p className="text-xs text-error mt-1 font-medium">Acción inmediata requerida</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-error/5 rounded-full blur-2xl"></div>
        </div>

        {/* Stock Bajo */}
        <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10 flex flex-col gap-4 relative overflow-hidden group">
          <div className="flex items-center justify-between z-10">
            <span className="text-on-surface-variant font-semibold text-sm uppercase tracking-wider">Stock Bajo</span>
            <div className="p-2 bg-tertiary-fixed-dim/10 rounded-lg group-hover:bg-tertiary-fixed-dim/20 transition-colors">
              <span className="material-symbols-outlined text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
          </div>
          <div className="z-10">
            <p className="text-4xl font-extrabold text-on-surface tracking-tighter">{stats.lowStockItems}</p>
            <p className="text-xs text-on-surface-variant mt-1 font-medium">Por debajo del umbral mínimo</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-tertiary-fixed-dim/5 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Table Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              className="w-full bg-surface-container border-outline-variant/20 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none"
              placeholder="Filtrar por nombre o SKU..."
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
            />
          </div>
          <select
            className="bg-surface-container border-outline-variant/20 rounded-lg px-4 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/40 transition-all outline-none appearance-none cursor-pointer"
            onChange={handleCategoriaChange}
          >
            <option value="">Categoría: Todas</option>
            {CATEGORIAS.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant font-medium">
            {loading ? 'Cargando...' : `Mostrar ${fromItem}-${toItem} de ${total}`}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1 || loading}
              onClick={() => { const np = Math.max(1, page - 1); setPage(np); fetchPage(np, search, categoria); }}
              className="p-1.5 bg-surface-container-highest rounded-md text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => { const np = Math.min(totalPages, page + 1); setPage(np); fetchPage(np, search, categoria); }}
              className="p-1.5 bg-surface-container-highest rounded-md text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Data Table */}
      <div className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-low shadow-2xl shadow-black/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-high/50 border-b border-outline-variant/10">
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Producto</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nivel de Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Precio Venta</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-surface-container-highest" />
                        <div className="space-y-2">
                          <div className="h-3 w-32 rounded bg-surface-container-highest" />
                          <div className="h-2.5 w-20 rounded bg-surface-container-highest" />
                        </div>
                      </div>
                    </td>
                    {[1, 2, 3, 4, 5].map((j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-3 w-20 rounded bg-surface-container-highest" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : productos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl">inventory_2</span>
                      <p className="font-medium">No se encontraron productos</p>
                    </div>
                  </td>
                </tr>
              ) : (
                productos.map((producto) => {
                  const status = calcularEstadoStock(producto.stock_actual, producto.stock_minimo);
                  const pct = calcularPorcentajeStock(producto.stock_actual, producto.stock_minimo);
                  return (
                    <tr key={producto.id} className="hover:bg-surface-variant/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-surface-container-highest overflow-hidden border border-outline-variant/20 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              alt={producto.nombre}
                              className="h-full w-full object-cover"
                              src={producto.imagen_url || 'https://via.placeholder.com/150'}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-on-surface group-hover:text-primary transition-colors">{producto.nombre}</p>
                            <p className="text-xs text-on-surface-variant">SKU: {producto.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-surface-container-highest text-secondary text-[10px] font-extrabold uppercase rounded-full tracking-wide text-nowrap">
                          {producto.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-40 space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-on-surface">{producto.stock_actual} uds.</span>
                            <span className={pct === 0 ? 'text-on-surface-variant' : pct <= 20 ? 'text-error' : 'text-on-surface-variant'}>
                              {pct}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct === 0 ? 'bg-error-container' : pct <= 20 ? 'bg-error' : 'bg-primary-dim'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-on-surface">{formatSoles(producto.precio_venta)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 text-xs font-bold ${
                          status === 'En Stock' ? 'text-tertiary-fixed-dim' :
                          status === 'Bajo Stock' ? 'text-error' :
                          'text-on-surface-variant'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            status === 'En Stock' ? 'bg-tertiary-fixed-dim' :
                            status === 'Bajo Stock' ? 'bg-error animate-pulse' :
                            'bg-outline'
                          }`} />
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditProduct(producto)}
                            className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                          >
                            <span className="material-symbols-outlined text-xl">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeactivate(producto.id)}
                            className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"
                            title="Desactivar producto"
                          >
                            <span className="material-symbols-outlined text-xl">delete</span>
                          </button>
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
        <div className="px-6 py-4 bg-surface-container-high/30 flex items-center justify-between">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Estable</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-error"></span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Crítico</span>
            </div>
          </div>
          <div className="text-xs text-on-surface-variant italic">
            {loading ? 'Actualizando...' : `${total} productos activos`}
          </div>
        </div>
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        onSave={handleSave}
      />
    </div>
  );
}

import React from 'react';
import { mockProducts, mockStats } from './mockData';

export default function ProductosPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-3xl font-extrabold tracking-tight text-on-surface mb-1">Gestión de Productos</h3>
          <p className="text-on-surface-variant font-medium">Visualización completa del inventario y control de stock</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-surface-variant text-primary font-semibold rounded-md border border-primary/20 hover:bg-primary/10 transition-all">
            <span className="material-symbols-outlined text-xl">download</span>
            Exportar
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary-dim to-primary text-on-primary-container font-bold rounded-md shadow-lg shadow-primary/20 active:scale-95 transition-all">
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
            <p className="text-4xl font-extrabold text-on-surface tracking-tighter">{mockStats.totalSKUs}</p>
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
            <p className="text-4xl font-extrabold text-on-surface tracking-tighter">{mockStats.totalValue}</p>
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
            <p className="text-4xl font-extrabold text-on-surface tracking-tighter">{mockStats.criticalAlerts}</p>
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
            <p className="text-4xl font-extrabold text-on-surface tracking-tighter">{mockStats.lowStockItems}</p>
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
            />
          </div>
          <select className="bg-surface-container border-outline-variant/20 rounded-lg px-4 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary/40 transition-all outline-none appearance-none cursor-pointer">
            <option>Categoría: Todas</option>
            <option>Electrónica</option>
            <option>Mobiliario</option>
            <option>Hardware</option>
            <option>Suministros</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant font-medium">Mostrar 1-10 de 1,284</span>
          <div className="flex gap-1">
            <button className="p-1.5 bg-surface-container-highest rounded-md text-on-surface-variant hover:text-on-surface transition-colors"><span className="material-symbols-outlined text-lg">chevron_left</span></button>
            <button className="p-1.5 bg-surface-container-highest rounded-md text-on-surface-variant hover:text-on-surface transition-colors"><span className="material-symbols-outlined text-lg">chevron_right</span></button>
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
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Precio Unitario</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {mockProducts.map((product) => (
                <tr key={product.id} className="hover:bg-surface-variant/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-surface-container-highest overflow-hidden border border-outline-variant/20 shrink-0">
                        <img alt={product.name} className="h-full w-full object-cover" src={product.imageUrl} />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface group-hover:text-primary transition-colors">{product.name}</p>
                        <p className="text-xs text-on-surface-variant">SKU: {product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-surface-container-highest text-secondary text-[10px] font-extrabold uppercase rounded-full tracking-wide text-nowrap">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-40 space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-on-surface">{product.stock} uds.</span>
                        <span className={
                          product.stockPercentage === 0 ? "text-on-surface-variant" : 
                          product.stockPercentage <= 20 ? "text-error" : 
                          "text-on-surface-variant"
                        }>{product.stockPercentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                             product.stockPercentage === 0 ? "bg-error-container" : 
                             product.stockPercentage <= 20 ? "bg-error" : 
                             "bg-primary-dim"
                          }`} 
                          style={{ width: `${product.stockPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-on-surface">${product.price.toFixed(2)}</p>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`flex items-center gap-1.5 text-xs font-bold ${
                        product.status === 'En Stock' ? 'text-tertiary-fixed-dim' :
                        product.status === 'Bajo Stock' ? 'text-error' :
                        'text-on-surface-variant'
                     }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          product.status === 'En Stock' ? 'bg-tertiary-fixed-dim' :
                          product.status === 'Bajo Stock' ? 'bg-error animate-pulse' :
                          'bg-outline'
                        }`}></span>
                        {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                      <button className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all">
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
            Sincronizado hace 2 minutos
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { EntradaModal } from '@/components/modules/movimientos/EntradaModal';

// Mock Data for the table
const MOCK_MOVIMIENTOS = [
  { id: 'TX-94281', estado: 'ENTRADA', actNombre: 'MacBook Pro M2 Max', icon: 'laptop_mac', orgDest: 'Logística Global -> Almacén Principal', qty: '+12 Unidades', date: '12 Oct, 2023', time: '14:23 PM', colorType: 'tertiary' },
  { id: 'TX-94285', estado: 'SALIDA', actNombre: 'Cisco Catalyst 9300', icon: 'router', orgDest: 'Hub Central -> Digital Corp S.A.', qty: '-04 Unidades', date: '12 Oct, 2023', time: '12:10 PM', colorType: 'secondary' },
  { id: 'TX-94289', estado: 'TRANSFERENCIA', actNombre: 'Dell UltraSharp 32"', icon: 'monitor', orgDest: 'Almacén Zona B -> Sala Tech 4', qty: '15 Unidades', date: '11 Oct, 2023', time: '09:45 AM', colorType: 'primary' },
  // Adding a few more to populate the table realistically
  { id: 'TX-94290', estado: 'ENTRADA', actNombre: 'iPad Pro 12.9"', icon: 'tablet_mac', orgDest: 'Proveedor Apple -> Almacén Principal', qty: '+20 Unidades', date: '10 Oct, 2023', time: '16:05 PM', colorType: 'tertiary' },
  { id: 'TX-94292', estado: 'SALIDA', actNombre: 'Logitech MX Master 3S', icon: 'mouse', orgDest: 'Almacén -> Cliente', qty: '-01 Unidades', date: '10 Oct, 2023', time: '10:30 AM', colorType: 'secondary' },
];

// Mock Data for the chart
const MOCK_CHART_DATA = [
  { month: 'Ene', height: '40%', colorClass: 'bg-primary/20 hover:bg-primary/40', isPeak: false },
  { month: 'Feb', height: '55%', colorClass: 'bg-primary/20 hover:bg-primary/40', isPeak: false },
  { month: 'Mar', height: '30%', colorClass: 'bg-primary/20 hover:bg-primary/40', isPeak: false },
  { month: 'Abr', height: '85%', colorClass: 'bg-primary hover:opacity-80', isPeak: true, peakValue: '1,420 tx' },
  { month: 'May', height: '70%', colorClass: 'bg-primary/20 hover:bg-primary/40', isPeak: false },
  { month: 'Jun', height: '50%', colorClass: 'bg-primary/20 hover:bg-primary/40', isPeak: false },
  { month: 'Jul', height: '45%', colorClass: 'bg-primary/20 hover:bg-primary/40', isPeak: false },
  { month: 'Ago', height: '90%', colorClass: 'bg-primary/20 hover:bg-primary/40', isPeak: false },
  { month: 'Sep', height: '60%', colorClass: 'bg-primary/20 hover:bg-primary/40', isPeak: false },
  { month: 'Oct', height: '45%', colorClass: 'bg-secondary hover:opacity-80', isPeak: false },
  { month: 'Nov', height: '35%', colorClass: 'bg-primary/20 hover:bg-primary/40', isPeak: false },
  { month: 'Dic', height: '65%', colorClass: 'bg-primary/20 hover:bg-primary/40', isPeak: false },
];

export default function MovimientosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-8 space-y-8 max-w-[1400px] w-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
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
            Nueva Entrada
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
          <h3 className="text-3xl font-bold mt-1 tracking-tight text-on-surface">1,284</h3>
          <p className="text-[10px] text-tertiary-dim mt-2 flex items-center gap-1 font-bold">
            <span className="material-symbols-outlined text-xs">trending_up</span> +12% desde el mes pasado
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
          <h3 className="text-3xl font-bold mt-1 tracking-tight text-on-surface">432</h3>
          <div className="w-full bg-surface-container mt-4 h-1.5 rounded-full overflow-hidden">
            <div className="bg-tertiary h-full w-[65%]"></div>
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
          <h3 className="text-3xl font-bold mt-1 tracking-tight text-on-surface">219</h3>
          <div className="w-full bg-surface-container mt-4 h-1.5 rounded-full overflow-hidden">
            <div className="bg-secondary h-full w-[35%]"></div>
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-panel p-6 rounded-xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="font-bold text-lg text-on-surface">Intensidad de Movimientos</h4>
              <p className="text-xs text-on-surface-variant">Histórico de actividad mensual</p>
            </div>
            <select className="bg-surface-container border-none text-xs rounded-md focus:ring-1 focus:ring-primary px-3 py-1.5 text-on-surface cursor-pointer text-sm outline-none">
              <option>Por Mes</option>
              <option>Por Día</option>
            </select>
          </div>
          
          <div className="h-48 flex items-end justify-between gap-2 px-2 mt-4 pt-4 border-t border-outline-variant/10">
            {/* Monthly Bar Chart (Dynamic from Mock Data) */}
            {MOCK_CHART_DATA.map((data, index) => (
              <div key={index} className="w-full group relative h-full flex items-end">
                <div 
                  className={`w-full rounded-t transition-all ${data.colorClass}`} 
                  style={{ height: data.height }}
                >
                  {data.isPeak && data.peakValue && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] font-bold px-2 py-1 rounded hidden group-hover:block whitespace-nowrap shadow-xl z-10">
                      Pico: {data.peakValue}
                    </div>
                  )}
                </div>
                <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase font-bold ${data.isPeak ? 'text-primary' : data.colorClass.includes('secondary') ? 'text-secondary' : 'text-on-surface-variant'}`}>
                  {data.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-low p-6 rounded-xl flex flex-col gap-4 relative overflow-hidden group">
          <h4 className="font-bold text-lg text-on-surface mb-6">Distribución por Tipo</h4>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Entradas (Compras)</span>
                <span className="font-bold text-on-surface">65%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-tertiary h-full w-[65%] rounded-full shadow-[0_0_10px_rgba(198,255,243,0.3)]"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Salidas (Ventas)</span>
                <span className="font-bold text-on-surface">28%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-secondary h-full w-[28%] rounded-full"></div>
              </div>
            </div>
            <div className="space-y-2">
               <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Transferencias</span>
                <span className="font-bold text-on-surface">7%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[7%] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Table Section */}
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-container rounded-md border border-outline-variant/10 min-w-[180px] cursor-pointer hover:bg-surface-variant/50 transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">calendar_today</span>
            <span className="text-sm font-medium text-on-surface">Últimos 7 Días</span>
            <span className="material-symbols-outlined text-on-surface-variant text-sm ml-auto">expand_more</span>
          </div>
          
          <button className="bg-surface-container text-on-surface px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold hover:bg-surface-variant/50 transition-all border border-outline-variant/10">
            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
            Exportar PDF
          </button>
          
          <button className="bg-surface-container text-on-surface px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold hover:bg-surface-variant/50 transition-all border border-outline-variant/10">
            <span className="material-symbols-outlined text-lg">table_chart</span>
            Exportar Excel
          </button>
          
          <div className="ml-auto flex items-center gap-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input 
                className="w-full bg-surface-container border-outline-variant/20 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none" 
                placeholder="Buscar movimientos..." 
                type="text"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
          <h4 className="font-bold text-lg text-on-surface">Registro de Actividad Detallado</h4>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant font-medium">
              Mostrar 1-5 de 1,284
            </span>
            <div className="flex gap-1">
              <button
                disabled={true}
                className="p-1.5 bg-surface-container-highest rounded-md text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button
                disabled={false}
                className="p-1.5 bg-surface-container-highest rounded-md text-on-surface-variant hover:text-on-surface transition-colors hover:bg-surface-variant/50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Data Table */}
        <div className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-low shadow-2xl shadow-black/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-surface-container-high/50 border-b border-outline-variant/10">
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">ID Transacción</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nombre Activo</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Origen / Destino</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {MOCK_MOVIMIENTOS.map((mov, idx) => {
                   const colorClassTx = mov.colorType === 'tertiary' ? 'text-tertiary' : mov.colorType === 'secondary' ? 'text-secondary' : 'text-primary';
                   const bgColorClass = mov.colorType === 'tertiary' ? 'bg-tertiary shadow-[0_0_8px_rgba(198,255,243,0.6)]' : mov.colorType === 'secondary' ? 'bg-secondary shadow-[0_0_8px_rgba(193,128,255,0.6)]' : 'bg-primary shadow-[0_0_8px_rgba(145,171,255,0.6)]';
                   const [origen, destino] = mov.orgDest.split(' -> ');

                   return (
                    <tr key={idx} className="hover:bg-surface-container transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${bgColorClass}`}></div>
                          <span className={`text-xs font-semibold ${colorClassTx}`}>{mov.estado}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-mono text-on-surface-variant">#{mov.id}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center">
                            <span className={`material-symbols-outlined text-lg ${colorClassTx}`}>{mov.icon}</span>
                          </div>
                          <span className="text-sm font-semibold text-on-surface">{mov.actNombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-on-surface-variant">{origen}</span>
                          <span className={`material-symbols-outlined text-xs ${mov.estado === 'TRANSFERENCIA' ? 'text-primary align-middle font-bold' : 'text-on-surface-variant'}`}>
                            {mov.estado === 'TRANSFERENCIA' ? 'swap_horiz' : 'arrow_forward'}
                          </span>
                          <span className="font-medium text-on-surface">{destino}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-sm font-bold ${mov.qty.startsWith('-') ? 'text-secondary' : mov.qty.startsWith('+') ? 'text-tertiary' : 'text-on-surface'}`}>{mov.qty}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-on-surface">{mov.date}</span>
                          <span className="text-[10px] text-on-surface-variant">{mov.time}</span>
                        </div>
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Info */}
          <div className="px-6 py-4 bg-surface-container-high/30 flex items-center justify-between border-t border-outline-variant/10">
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Entrada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Salida</span>
              </div>
               <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Transferencia</span>
              </div>
            </div>
            <div className="text-xs text-on-surface-variant italic">
              1,284 movimientos registrados
            </div>
          </div>
        </div>
      </div>

      <EntradaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

"use client";

import React from "react";
import Image from "next/image";

export function DashboardModule() {
  return (
    <div className="flex-1 flex flex-col">
      {/* TopAppBar specific to Dashboard */}
      <header className="flex items-center justify-between px-8 py-6 z-30">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">
            Dashboard
          </h2>
          <p className="text-xs text-on-surface-variant font-medium mt-1">
            Bienvenido de nuevo, Administrador
          </p>
        </div>
        <div className="flex items-center gap-6">
          {/* Filters */}
          <div className="flex bg-surface-container rounded-xl p-1">
            <button className="px-4 py-1.5 text-xs font-bold rounded-lg bg-primary/20 text-primary transition-all">
              Este mes
            </button>
            <button className="px-4 py-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-all">
              Últimos 7 días
            </button>
            <button className="px-4 py-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-all">
              Hoy
            </button>
          </div>
        </div>
      </header>

      <div className="px-8 pb-10 space-y-8">
        {/* Metrics Summary */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Metric 1 */}
          <div className="bg-surface-container p-6 rounded-xl relative overflow-hidden group hover:translate-y-[-4px] transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-12 translate-x-12 blur-2xl group-hover:bg-primary/10 transition-colors"></div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                  Venta Total
                </p>
                <h3 className="text-2xl font-extrabold mt-2 text-on-surface">
                  S/ 124,530
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
                <span
                  className="material-symbols-outlined text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  payments
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-tertiary-dim text-xs font-bold flex items-center gap-1 bg-tertiary-dim/10 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-sm">
                  trending_up
                </span>{" "}
                +12%
              </span>
              <span className="text-[10px] text-on-surface-variant font-medium">
                vs mes pasado
              </span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-surface-container p-6 rounded-xl relative overflow-hidden group hover:translate-y-[-4px] transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full -translate-y-12 translate-x-12 blur-2xl"></div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                  Compras Totales
                </p>
                <h3 className="text-2xl font-extrabold mt-2 text-on-surface">
                  S/ 45,210
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-secondary-container/20 flex items-center justify-center text-secondary">
                <span
                  className="material-symbols-outlined text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  shopping_bag
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-error text-xs font-bold flex items-center gap-1 bg-error/10 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-sm">
                  trending_down
                </span>{" "}
                -5%
              </span>
              <span className="text-[10px] text-on-surface-variant font-medium">
                vs mes pasado
              </span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-surface-container p-6 rounded-xl relative overflow-hidden group hover:translate-y-[-4px] transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-tertiary/5 rounded-full -translate-y-12 translate-x-12 blur-2xl"></div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                  Valor Inventario
                </p>
                <h3 className="text-2xl font-extrabold mt-2 text-on-surface">
                  S/ 892,100
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-tertiary-container/10 flex items-center justify-center text-tertiary-dim">
                <span
                  className="material-symbols-outlined text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  warehouse
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-on-surface-variant text-xs font-bold bg-surface-variant px-2 py-0.5 rounded-full">
                850 ítems
              </span>
              <span className="text-[10px] text-on-surface-variant font-medium">
                Total activos
              </span>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="bg-surface-container p-6 rounded-xl relative overflow-hidden group hover:translate-y-[-4px] transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-fixed/5 rounded-full -translate-y-12 translate-x-12 blur-2xl"></div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                  Clientes Nuevos
                </p>
                <h3 className="text-2xl font-extrabold mt-2 text-on-surface">
                  128
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-surface-variant flex items-center justify-center text-primary-fixed-dim">
                <span
                  className="material-symbols-outlined text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  person_add
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-tertiary-dim text-xs font-bold flex items-center gap-1 bg-tertiary-dim/10 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-sm">
                  trending_up
                </span>{" "}
                +24%
              </span>
              <span className="text-[10px] text-on-surface-variant font-medium">
                este mes
              </span>
            </div>
          </div>
        </section>

        {/* Middle Section: Analysis and Alerts */}
        <section className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-3 md:grid-cols-3 gap-8">
          {/* Performance Chart (Simulated with CSS/SVG) */}
          <div className="md:col-span-2 lg:col-span-2 xl:col-span-2 bg-surface-container p-8 rounded-2xl relative">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-on-surface">
                  Análisis de Rendimiento
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Comparativa mensual de Ventas vs Compras
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(145,171,255,0.4)]"></span>
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Ventas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_8px_rgba(193,128,255,0.4)]"></span>
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Compras
                  </span>
                </div>
              </div>
            </div>

            {/* SVG Chart Simulation */}
            <div className="h-64 w-full relative mt-4">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between">
                <div className="border-t border-white/5 w-full"></div>
                <div className="border-t border-white/5 w-full"></div>
                <div className="border-t border-white/5 w-full"></div>
                <div className="border-t border-white/5 w-full"></div>
              </div>

              {/* Visual Area Chart Path */}
              <svg
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
                viewBox="0 0 100 100"
              >
                {/* Area Sales */}
                <defs>
                  <linearGradient id="gradPrimary" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop
                      offset="0%"
                      style={{ stopColor: "rgba(145,171,255,0.2)", stopOpacity: 1 }}
                    ></stop>
                    <stop
                      offset="100%"
                      style={{ stopColor: "rgba(145,171,255,0)", stopOpacity: 1 }}
                    ></stop>
                  </linearGradient>
                </defs>

                <path
                  d="M0,80 Q25,40 50,60 T100,20 L100,100 L0,100 Z"
                  fill="url(#gradPrimary)"
                ></path>
                <path
                  d="M0,80 Q25,40 50,60 T100,20"
                  fill="none"
                  stroke="#91abff"
                  strokeLinecap="round"
                  strokeWidth="3"
                ></path>

                {/* Path Purchases */}
                <path
                  d="M0,90 Q30,70 60,85 T100,75"
                  fill="none"
                  stroke="#c180ff"
                  strokeDasharray="6,4"
                  strokeLinecap="round"
                  strokeWidth="2"
                ></path>
              </svg>

              {/* Legend X-Axis */}
              <div className="absolute bottom-[-24px] w-full flex justify-between text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-tighter">
                <span>Ene</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Abr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
              </div>
            </div>
          </div>

          {/* Stock Alerts Section */}
          <div className="bg-surface-container-high p-8 rounded-2xl border border-outline-variant/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-on-surface">Alertas de Stock</h3>
              <span className="w-6 h-6 rounded-full bg-error-container/30 text-error flex items-center justify-center text-[10px] font-bold">
                4
              </span>
            </div>

            <div className="space-y-4">
              {/* Alert Item 1 */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-container hover:bg-surface-variant transition-colors group cursor-pointer">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
                  <Image
                    className="object-cover"
                    alt="Nike Air Max Pro"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLBE2hbpSkDGv9BQxxHvFukEJDq3Ft87en1ujJ1QdyYL0RJNweNfCwym_AmIy-F8ZQeL75Qer-ZaXRecGGYBHX5KWJHSUwPyaqnfqF_9D9R-1atvtnU--eyzq5FMf-u5kPRqkTgM0I4pwkRersNEW1hreWI_EBDBMnzEWl6Gfb5r2-G_kbBeiStx1-Mxgzl16Pl7jNBM9wkY1CiloEaS3QfjdDZDaHW7Mo5EsL41LwqDxnHIIg66heQxDcQPMfumpTlxQ6GeNYEsuJ"
                    fill
                    sizes="48px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-on-surface truncate">
                    Nike Air Max Pro
                  </h4>
                  <p className="text-[10px] text-on-surface-variant">
                    Calzado Deportivo
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-error">2 unid.</span>
                  <p className="text-[10px] text-error/60 font-bold">CRÍTICO</p>
                </div>
              </div>

              {/* Alert Item 2 */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-container hover:bg-surface-variant transition-colors group cursor-pointer">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
                  <Image
                    className="object-cover"
                    alt="Teclado Razer v2"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuACkzB6Pyw-SGysCWR4zHZ4NoTcPCZXZtmYD2HsiZIelyh8IknpD9xi7hjqMhqFKrjEAZGr6PAoLbthgzMTgCK9PItQY-9xIBZZwNFYl-nGuZbOGch0JmB4LQSy9wyfJAQmBn2ArFv4NOZM9MSsHHSUy2oXlK1G9MigG0YPe_lJOTc8c8z9l0Q6h1g7SSBpPCdC1sgJaf-rGJoI9oHxDZyR-9ie2kL9Bm18FBoG1F0I41Hlcik_J-s91rhelsiHWGe-AdhDyQGzvcMV"
                    fill
                    sizes="48px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-on-surface truncate">
                    Teclado Razer v2
                  </h4>
                  <p className="text-[10px] text-on-surface-variant">
                    Accesorios PC
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-error">5 unid.</span>
                  <p className="text-[10px] text-error/60 font-bold">BAJO</p>
                </div>
              </div>

              {/* Alert Item 3 */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-container hover:bg-surface-variant transition-colors group cursor-pointer">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
                  <Image
                    className="object-cover"
                    alt="Smartwatch S3"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTaP9aKM7wB51i__466SPURtL0RIoLAE3tLevvK8fqxUYHPa0NKmxGeKXR1XkS0P4xN4MC4T-2sjDTtMWV-F0sF99f1-CDv63RnwbHIoh9INHa20sct_n8t2YS5ohGE3tTKM57RiIEYqOlyTWxREbMf-JhhmKI5Qui9_RNenS_a7czqns0PI8jyDmV8PxCBBb_gotH0LvD5EpJ_tmVbp21KbNADCUHWx5S9ae6VnSftIwmuAqHvb3JhqQ6Od4zXP9L4m0n3tT6ajtS"
                    fill
                    sizes="48px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-on-surface truncate">
                    Smartwatch S3
                  </h4>
                  <p className="text-[10px] text-on-surface-variant">Tecnología</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-error">3 unid.</span>
                  <p className="text-[10px] text-error/60 font-bold">CRÍTICO</p>
                </div>
              </div>
            </div>

            <button className="w-full mt-6 py-3 rounded-xl bg-surface-variant text-primary text-xs font-bold hover:bg-primary/10 transition-colors">
              Ver todas las alertas
            </button>
          </div>
        </section>

        {/* Recent Activity Table */}
        <section className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-low shadow-2xl shadow-black/40">
          <div className="p-8 flex items-center justify-between border-b border-outline-variant/10 bg-surface-container-high/20">
            <h3 className="text-xl font-bold text-on-surface">
              Actividad Reciente
            </h3>
            <button className="text-sm font-bold text-primary hover:underline">
              Descargar Reporte
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-container-high/50 border-b border-outline-variant/10">
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Referencia</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Fecha / Hora</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Monto</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {/* Row 1 */}
                <tr className="hover:bg-surface-variant/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-bold text-on-surface group-hover:text-primary transition-colors">
                      FAC-2024-001
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                      <span className="material-symbols-outlined text-primary-dim text-lg">
                        sell
                      </span>{" "}
                      Venta Directa
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-on-surface-variant/80">
                    12 Mayo, 2024 - 14:30
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-primary-container/20 flex items-center justify-center text-[10px] text-primary-fixed-dim font-bold border border-primary-container/30">
                        JD
                      </div>
                      <span className="text-xs font-medium text-on-surface">
                        Juan Delgado
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-bold text-on-surface">
                      S/ 4,250.00
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-1 bg-surface-container-highest text-tertiary-fixed-dim text-[10px] font-extrabold uppercase rounded-full tracking-wide text-nowrap">
                      COMPLETADO
                    </span>
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-surface-variant/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-bold text-on-surface group-hover:text-primary transition-colors">
                      OC-44290
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                      <span className="material-symbols-outlined text-secondary text-lg">
                        shopping_cart
                      </span>{" "}
                      Compra Stock
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-on-surface-variant/80">
                    12 Mayo, 2024 - 11:15
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-secondary-container/20 flex items-center justify-center text-[10px] text-secondary-fixed-dim font-bold border border-secondary-container/30">
                        AM
                      </div>
                      <span className="text-xs font-medium text-on-surface">
                        Ana Martínez
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-bold text-on-surface">
                      S/ 12,800.00
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-1 bg-surface-container-highest text-primary text-[10px] font-extrabold uppercase rounded-full tracking-wide text-nowrap">
                      EN PROCESO
                    </span>
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-surface-variant/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-bold text-on-surface group-hover:text-primary transition-colors">
                      MOV-9921
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                      <span className="material-symbols-outlined text-outline text-lg">
                        swap_horiz
                      </span>{" "}
                      Traslado Almacén
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-on-surface-variant/80">
                    11 Mayo, 2024 - 17:45
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-surface-variant flex items-center justify-center text-[10px] text-on-surface-variant font-bold border border-outline-variant/30">
                        RL
                      </div>
                      <span className="text-xs font-medium text-on-surface">
                        Ricardo Luna
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-bold text-on-surface-variant">
                      —
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-1 bg-surface-container-highest text-outline text-[10px] font-extrabold uppercase rounded-full tracking-wide text-nowrap">
                      PENDIENTE
                    </span>
                  </td>
                </tr>

                {/* Row 4 */}
                <tr className="hover:bg-surface-variant/30 transition-colors group border-b-0">
                  <td className="px-6 py-4">
                    <span className="font-bold text-on-surface group-hover:text-primary transition-colors">
                      FAC-2024-002
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                      <span className="material-symbols-outlined text-primary-dim text-lg">
                        sell
                      </span>{" "}
                      Venta Online
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-on-surface-variant/80">
                    11 Mayo, 2024 - 09:20
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-primary-container/20 flex items-center justify-center text-[10px] text-primary-fixed-dim font-bold border border-primary-container/30">
                        SYS
                      </div>
                      <span className="text-xs font-medium text-on-surface">
                        Sistema Automático
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-bold text-on-surface">
                      S/ 850.50
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-1 bg-surface-container-highest text-tertiary-fixed-dim text-[10px] font-extrabold uppercase rounded-full tracking-wide text-nowrap">
                      COMPLETADO
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

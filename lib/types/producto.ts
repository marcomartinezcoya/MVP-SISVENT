// ─────────────────────────────────────────────
//  Tipos del módulo de Productos
//  Fuente de verdad única – espejo de la tabla DB
// ─────────────────────────────────────────────

export interface Producto {
  id: string;
  nombre: string;
  /** Código auto-generado: PROD-0001, PROD-0002, … Never editable by the user. */
  sku: string;
  categoria: string | null;
  precio_compra: number;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  imagen_url: string | null;
  estado: boolean;
  created_at: string;
}

/**
 * Input para CREAR un producto.
 * El SKU es omitido: la DB lo genera automáticamente vía trigger.
 */
export type ProductoCreateInput = Omit<Producto, 'id' | 'created_at' | 'sku'>;

/**
 * Input para ACTUALIZAR un producto.
 * El SKU viene del registro existente (no editable), stock_actual se incluye
 * para poder corregirlo directamente desde el formulario de edición.
 */
export type ProductoUpdateInput = Omit<Producto, 'id' | 'created_at'>;

// Respuesta estándar de las server actions
export interface ActionResult<T = null> {
  data: T;
  error: string | null;
}

// Estadísticas del dashboard
export interface ProductoStats {
  totalSKUs: number;
  totalValue: number;
  criticalAlerts: number;
  lowStockItems: number;
}

// Estado calculado (solo para la UI – no se persiste en DB)
export type StockStatus = 'En Stock' | 'Bajo Stock' | 'Agotado';

export function calcularEstadoStock(
  stock_actual: number,
  stock_minimo: number,
): StockStatus {
  if (stock_actual === 0) return 'Agotado';
  if (stock_actual <= stock_minimo) return 'Bajo Stock';
  return 'En Stock';
}

export function calcularPorcentajeStock(
  stock_actual: number,
  stock_minimo: number,
): number {
  if (stock_actual === 0) return 0;
  const referencia = stock_minimo * 3 || 30;
  return Math.min(Math.round((stock_actual / referencia) * 100), 100);
}

// ── Movimiento Type Definitions ──────────────────────────────────────────────

export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA' | 'AJUSTE';

// ── DB row type ──────────────────────────────────────────────────────────────

export interface MovimientoDB {
  id: string;
  codigo_movimiento: string;
  producto_id: string;
  tipo_movimiento: TipoMovimiento;
  origen: string | null;
  destino: string | null;
  referencia: string | null;
  motivo: string | null;
  cantidad: number;
  costo_unitario: number;
  valor_total: number;
  fecha_registro: string;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  estado: boolean;
  // Joined relation
  productos?: {
    nombre: string;
    sku: string;
    stock_actual: number;
    precio_compra: number | null;
  } | null;
}

// ── Input types ──────────────────────────────────────────────────────────────

export interface MovimientoCreateInput {
  producto_id: string;
  tipo_movimiento: TipoMovimiento;
  origen?: string;
  destino?: string;
  referencia?: string;
  motivo: string;
  cantidad: number;          // positive or negative allowed
  costo_unitario: number;
  fecha_registro?: string;
}

export interface MovimientoUpdateInput {
  motivo?: string;
  referencia?: string;
  estado?: boolean;
}

// ── Stats types ──────────────────────────────────────────────────────────────

export interface MovimientosStats {
  totalMovimientos: number;
  entradasHoy: number;
  salidasHoy: number;
}

// ── Chart data types ─────────────────────────────────────────────────────────

export interface MovimientoHistoricoItem {
  month: string;
  total: number;
  entradas: number;
  salidas: number;
}

export interface DistribucionTipo {
  tipo: TipoMovimiento;
  count: number;
  porcentaje: number;
}

// ── Query params ─────────────────────────────────────────────────────────────

export interface GetMovimientosParams {
  page?: number;
  limit?: number;
  search?: string;
  tipo?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

// ── Product option for modal ─────────────────────────────────────────────────

export interface ProductoMovimientoOption {
  id: string;
  nombre: string;
  sku: string;
  stock_actual: number;
  precio_compra: number | null;
}

// ── UI Helpers ───────────────────────────────────────────────────────────────

export function getTipoMovimientoStyle(tipo: TipoMovimiento | string) {
  switch (tipo) {
    case 'ENTRADA':
      return {
        bg: 'bg-tertiary/10',
        text: 'text-tertiary',
        dot: 'bg-tertiary',
        shadow: 'shadow-[0_0_8px_rgba(198,255,243,0.6)]',
        icon: 'login',
      };
    case 'SALIDA':
      return {
        bg: 'bg-secondary/10',
        text: 'text-secondary',
        dot: 'bg-secondary',
        shadow: 'shadow-[0_0_8px_rgba(193,128,255,0.6)]',
        icon: 'logout',
      };
    case 'TRANSFERENCIA':
      return {
        bg: 'bg-primary/10',
        text: 'text-primary',
        dot: 'bg-primary',
        shadow: 'shadow-[0_0_8px_rgba(145,171,255,0.6)]',
        icon: 'swap_horiz',
      };
    case 'AJUSTE':
      return {
        bg: 'bg-error/10',
        text: 'text-error',
        dot: 'bg-error',
        shadow: 'shadow-[0_0_8px_rgba(255,113,108,0.5)]',
        icon: 'tune',
      };
    default:
      return {
        bg: 'bg-surface-variant',
        text: 'text-on-surface',
        dot: 'bg-outline',
        shadow: '',
        icon: 'sync_alt',
      };
  }
}

export function getTipoMovimientoLabel(tipo: TipoMovimiento | string): string {
  switch (tipo) {
    case 'ENTRADA':       return 'Entrada';
    case 'SALIDA':        return 'Salida';
    case 'TRANSFERENCIA': return 'Transferencia';
    case 'AJUSTE':        return 'Ajuste';
    default:              return tipo;
  }
}

export function formatCantidad(cantidad: number, tipo: TipoMovimiento | string): string {
  const abs = Math.abs(cantidad);
  if (tipo === 'ENTRADA')       return `+${abs} Unid.`;
  if (tipo === 'SALIDA')        return `-${abs} Unid.`;
  if (tipo === 'AJUSTE')        return (cantidad >= 0 ? '+' : '') + `${cantidad} Unid.`;
  return `${abs} Unid.`;
}

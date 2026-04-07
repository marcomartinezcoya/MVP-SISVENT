// ── Compra Type Definitions ──────────────────────────────────────────────────

// DB-aligned estado values (lowercase, matching Supabase CHECK constraint)
export type EstadoCompra = 'pendiente' | 'recibido' | 'cancelado';

// ── DB row types ─────────────────────────────────────────────────────────────

export interface CompraDetalleDB {
  id: string;
  compra_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number; // generated column
  // Joined relation (optional)
  productos?: { nombre: string; sku: string } | null;
}

export interface CompraDB {
  id: string;
  numero_orden: string;
  proveedor_id: string;
  fecha_emision: string; // ISO date
  estado: EstadoCompra;
  comentarios: string | null;
  subtotal: number;
  igv: number;
  total: number;
  created_at: string;
  updated_at: string | null;
  // Joined relations
  proveedores?: { nombre: string } | null;
  compra_detalle?: CompraDetalleDB[];
}

// ── Input types for creating / updating ──────────────────────────────────────

export interface CompraDetalleInput {
  producto_id: string;
  producto_nombre?: string; // for UI display only
  cantidad: number;
  precio_unitario: number;
}

export interface CompraCreateInput {
  proveedor_id: string;
  fecha_emision: string; // ISO date string YYYY-MM-DD
  estado: EstadoCompra;
  numero_orden?: string; // auto-generated if not provided
  comentarios?: string;
  detalles: CompraDetalleInput[];
}

export interface CompraUpdateInput {
  proveedor_id?: string;
  fecha_emision?: string;
  estado?: EstadoCompra;
  numero_orden?: string;
  comentarios?: string;
  detalles?: CompraDetalleInput[];
}

// ── Dashboard stats ───────────────────────────────────────────────────────────

export interface ComprasDashboardStats {
  valorPendientes: number;    // SUM(total) WHERE estado = 'pendiente'
  countPendientes: number;    // COUNT WHERE estado = 'pendiente'
  esperadosHoy: number;       // COUNT WHERE fecha_emision = today AND estado IN (...)
}

// ── Thin proveedor type for selects ──────────────────────────────────────────

export interface ProveedorOption {
  id: string;
  nombre: string;
}

// ── Thin producto type for selects ───────────────────────────────────────────

export interface ProductoOption {
  id: string;
  nombre: string;
  sku: string;
  precio_compra: number;
  stock_actual: number;
}

// ── UI Helpers ───────────────────────────────────────────────────────────────

export function getEstadoCompraStyle(estado: EstadoCompra | string) {
  switch (estado) {
    case 'pendiente':
      return { bg: 'bg-primary/10', text: 'text-primary' };
    case 'recibido':
      return { bg: 'bg-tertiary/10', text: 'text-tertiary' };
    case 'cancelado':
      return { bg: 'bg-error/10', text: 'text-error' };
    default:
      return { bg: 'bg-surface-variant', text: 'text-on-surface' };
  }
}

export function getEstadoLabel(estado: EstadoCompra | string): string {
  switch (estado) {
    case 'pendiente':  return 'Pendiente';
    case 'recibido':   return 'Recibido';
    case 'cancelado':  return 'Cancelado';
    default:           return estado;
  }
}

export function getProveedorInitialStyle(index: number) {
  const styles = [
    { bg: 'bg-primary/20', text: 'text-primary' },
    { bg: 'bg-secondary/20', text: 'text-secondary' },
    { bg: 'bg-tertiary/20', text: 'text-tertiary' },
    { bg: 'bg-error/20', text: 'text-error' },
  ];
  return styles[index % styles.length];
}

export function getProveedorInitials(nombre: string): string {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function formatSoles(amount: number): string {
  return `S/ ${amount.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Legacy mock exports kept for backward compat (no longer used in page)
export const MOCK_PROVEEDORES: ProveedorOption[] = [];
export const MOCK_COMPRAS: CompraDB[] = [];

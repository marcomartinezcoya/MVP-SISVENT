// ── Venta Type Definitions ───────────────────────────────────────────────────

// DB-aligned estado values (lowercase, matching Supabase CHECK constraint)
export type EstadoVenta = 'completado' | 'pendiente' | 'anulado';

// ── DB row types ─────────────────────────────────────────────────────────────

export interface VentaDetalleDB {
  id: string;
  venta_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number; // generated column
  // Joined relation (optional)
  productos?: { nombre: string; sku: string } | null;
}

export interface VentaDB {
  id: string;
  codigo_venta: string;
  cliente_id: string;
  fecha_emision: string; // ISO date
  subtotal: number;
  igv: number;
  total: number;
  estado: EstadoVenta;
  observaciones: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  // Joined relations
  clientes?: {
    tipo_cliente: string;
    nombres: string | null;
    apellidos: string | null;
    razon_social: string | null;
    documento: string | null;
    email: string | null;
    telefono: string | null;
    direccion: string | null;
  } | null;
  venta_detalle?: VentaDetalleDB[];
}

// ── Input types for creating / updating ──────────────────────────────────────

export interface VentaDetalleInput {
  producto_id: string;
  producto_nombre?: string; // for UI display only
  cantidad: number;
  precio_unitario: number;
}

export interface VentaCreateInput {
  cliente_id: string;
  fecha_emision: string; // ISO date string YYYY-MM-DD
  estado: EstadoVenta;
  codigo_venta?: string; // auto-generated if not provided
  observaciones?: string;
  detalles: VentaDetalleInput[];
}

export interface VentaUpdateInput {
  cliente_id?: string;
  fecha_emision?: string;
  estado?: EstadoVenta;
  observaciones?: string;
  detalles?: VentaDetalleInput[];
}

// ── Dashboard stats ─────────────────────────────────────────────────────────

export interface VentaStats {
  ventaMes: number;       // SUM(total) WHERE estado = 'completado' AND mes actual
  ventaDia: number;       // SUM(total) WHERE estado = 'completado' AND hoy
  totalOperaciones: number; // COUNT total de ventas
}

// ── Thin types for selects ──────────────────────────────────────────────────

export interface ClienteOption {
  id: string;
  tipo_cliente: string;
  nombres: string | null;
  apellidos: string | null;
  razon_social: string | null;
  documento: string | null;
}

export interface ProductoVentaOption {
  id: string;
  nombre: string;
  sku: string;
  precio_venta: number;
  stock_actual: number;
}

// ── UI Helpers ──────────────────────────────────────────────────────────────

export function getEstadoVentaStyle(estado: EstadoVenta | string) {
  switch (estado) {
    case 'completado':
      return { bg: 'bg-tertiary/10', text: 'text-tertiary' };
    case 'pendiente':
      return { bg: 'bg-primary/10', text: 'text-primary' };
    case 'anulado':
      return { bg: 'bg-error/10', text: 'text-error' };
    default:
      return { bg: 'bg-surface-variant', text: 'text-on-surface' };
  }
}

export function getEstadoVentaLabel(estado: EstadoVenta | string): string {
  switch (estado) {
    case 'completado': return 'Completado';
    case 'pendiente':  return 'Pendiente';
    case 'anulado':    return 'Anulado';
    default:           return estado;
  }
}

export function getClienteInitialStyle(index: number) {
  const styles = [
    { bg: 'bg-primary/20', text: 'text-primary' },
    { bg: 'bg-secondary/20', text: 'text-secondary' },
    { bg: 'bg-tertiary/20', text: 'text-tertiary' },
    { bg: 'bg-error/20', text: 'text-error' },
  ];
  return styles[index % styles.length];
}

export function getClienteDisplayName(cliente: {
  tipo_cliente: string;
  nombres: string | null;
  apellidos: string | null;
  razon_social: string | null;
} | null | undefined): string {
  if (!cliente) return 'Sin cliente';
  if (cliente.tipo_cliente === 'empresa' && cliente.razon_social) {
    return cliente.razon_social;
  }
  const parts = [cliente.nombres, cliente.apellidos].filter(Boolean);
  return parts.join(' ') || 'Sin nombre';
}

export function getClienteInitials(nombre: string): string {
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

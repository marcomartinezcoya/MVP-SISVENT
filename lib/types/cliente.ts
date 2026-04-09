// ══════════════════════════════════════════════════════════════════
//  TIPOS: Clientes
// ══════════════════════════════════════════════════════════════════

export type TipoCliente = 'empresa' | 'persona';

/** Row tal como viene de la base de datos */
export interface ClienteDB {
  id: string;
  tipo_cliente: TipoCliente;
  nombres: string | null;
  apellidos: string | null;
  razon_social: string | null;
  documento: string;
  telefono: string;
  email: string | null;
  direccion: string | null;
  foto_url: string | null;
  estado: boolean;
  created_at: string;
  updated_at: string;
}

/** Nombre visual según regla de negocio */
export function getNombreCliente(c: ClienteDB): string {
  if (c.tipo_cliente === 'empresa') return c.razon_social ?? '—';
  return [c.nombres, c.apellidos].filter(Boolean).join(' ') || '—';
}

/** Iniciales para avatar placeholder */
export function getInicialesCliente(c: ClienteDB): string {
  const name = getNombreCliente(c);
  const parts = name.split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

// ──────────────────────────────────────────────────────────────────
//  INPUTS para Server Actions
// ──────────────────────────────────────────────────────────────────

export interface ClienteCreateInput {
  tipo_cliente: TipoCliente;
  nombres?: string | null;
  apellidos?: string | null;
  razon_social?: string | null;
  documento: string;
  telefono: string;
  email?: string | null;
  direccion?: string | null;
  foto_url?: string | null;
  estado: boolean;
}

export interface ClienteUpdateInput {
  nombres?: string | null;
  apellidos?: string | null;
  razon_social?: string | null;
  telefono?: string;
  email?: string | null;
  direccion?: string | null;
  foto_url?: string | null;
  estado?: boolean;
}

// ──────────────────────────────────────────────────────────────────
//  Params para getClientes
// ──────────────────────────────────────────────────────────────────

export interface GetClientesParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Tipo legado — conservado para compatibilidad con el modal existente
export type ClienteCategoria = 'VIP' | 'Regular' | 'Nuevo';

/** @deprecated usar ClienteDB */
export interface Cliente {
  id: string;
  nombre: string;
  empresa: string;
  categoria: ClienteCategoria;
  pedidos_totales: number;
  valor_vida: number;
  avatar_url?: string | null;
  ultima_compra?: string | null;
  email: string;
  telefono: string;
  notas?: string;
}

/** @deprecated usar ClienteCreateInput */
export interface ClienteCreateInputLegacy {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  categoria: ClienteCategoria;
  avatar_url?: string | null;
  notas?: string;
}

/** @deprecated */
export interface ClienteUpdateInputLegacy extends Partial<ClienteCreateInputLegacy> {}

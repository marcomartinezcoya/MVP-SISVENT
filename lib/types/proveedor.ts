// ── Proveedor Type Definitions ─────────────────────────────────────────────

// ── DB-aligned types (matches Supabase schema) ──────────────────────────────

export interface CategoriaProveedorDB {
  id: string;
  nombre: string;
}

/** Row returned by Supabase when joining categorias_proveedor */
export interface ProveedorDB {
  id: string;
  nombre: string;
  ruc: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  categoria_id: string | null;
  direccion: string | null;
  estado: boolean;
  created_at: string;
  categorias_proveedor: { nombre: string } | null; // joined relation
}

export interface ProveedorCreateInput {
  nombre: string;
  ruc: string;
  contacto: string;
  telefono: string;
  email: string;
  categoria_id: string;
  direccion?: string;
  estado: boolean;
}

export type ProveedorUpdateInput = Partial<ProveedorCreateInput>;

export interface ProveedorStats {
  totalProveedores: number;
  proveedoresActivos: number;
  proveedoresInactivos: number;
}

// ── Category styling metadata (UI only) ────────────────────────────────────

export type CategoryStyle = {
  bg: string;
  text: string;
  avatarText: string;
};

// Maps category name → style tokens
export const CATEGORIA_STYLES: Record<string, CategoryStyle> = {
  Tecnología:      { bg: 'bg-primary/10',   text: 'text-primary',   avatarText: 'text-primary' },
  'Materia Prima': { bg: 'bg-secondary/10', text: 'text-secondary', avatarText: 'text-secondary' },
  Hardware:        { bg: 'bg-primary/10',   text: 'text-primary',   avatarText: 'text-primary' },
  Embalaje:        { bg: 'bg-tertiary/10',  text: 'text-tertiary',  avatarText: 'text-tertiary' },
  Oficina:         { bg: 'bg-secondary/10', text: 'text-secondary', avatarText: 'text-secondary' },
  Electricidad:    { bg: 'bg-tertiary/10',  text: 'text-tertiary',  avatarText: 'text-tertiary' },
  // fallback for any future categories
  _default:        { bg: 'bg-outline/10',   text: 'text-on-surface-variant', avatarText: 'text-on-surface-variant' },
};

export function getCategoriaStyle(nombre: string | null | undefined): CategoryStyle {
  if (!nombre) return CATEGORIA_STYLES._default;
  return CATEGORIA_STYLES[nombre] ?? CATEGORIA_STYLES._default;
}

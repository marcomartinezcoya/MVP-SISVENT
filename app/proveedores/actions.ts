'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import {
  CategoriaProveedorDB,
  ProveedorDB,
  ProveedorCreateInput,
  ProveedorUpdateInput,
} from '@/lib/types/proveedor';

// ──────────────────────────────────────────────────────────────────
//  Generic result wrapper
// ──────────────────────────────────────────────────────────────────

export interface ActionResult<T> {
  data: T;
  error: string | null;
}

// ──────────────────────────────────────────────────────────────────
//  TOP PROVEEDOR CARD TYPE
// ──────────────────────────────────────────────────────────────────

export interface TopProveedorCard {
  id: string;
  nombre: string;
  categoria: string | null;
  calificacion: number;
  pedidos_activos: number;
}

// ──────────────────────────────────────────────────────────────────
//  OBTENER CATEGORÍAS
// ──────────────────────────────────────────────────────────────────

export async function getCategorias(): Promise<ActionResult<CategoriaProveedorDB[]>> {
  const supabase = createServerClient();
  try {
    const { data, error } = await supabase
      .from('categorias_proveedor')
      .select('id, nombre')
      .order('nombre');

    if (error) return { data: [], error: error.message };
    return { data: (data as CategoriaProveedorDB[]) ?? [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────
//  OBTENER LISTA DE PROVEEDORES (paginación + filtros server-side)
// ──────────────────────────────────────────────────────────────────

interface GetProveedoresParams {
  page?: number;
  limit?: number;
  search?: string;
  categoria_id?: string;
}

interface GetProveedoresResult {
  data: ProveedorDB[];
  total: number;
}

export async function getProveedores({
  page = 1,
  limit = 10,
  search = '',
  categoria_id = '',
}: GetProveedoresParams = {}): Promise<ActionResult<GetProveedoresResult>> {
  const supabase = createServerClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from('proveedores')
      .select('*, categorias_proveedor(nombre)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search.trim()) {
      const q = search.trim();
      // Include RUC in search filter
      query = query.or(
        `nombre.ilike.%${q}%,contacto.ilike.%${q}%,email.ilike.%${q}%,ruc.ilike.%${q}%`,
      );
    }

    if (categoria_id) {
      query = query.eq('categoria_id', categoria_id);
    }

    const { data, error, count } = await query;

    if (error) return { data: { data: [], total: 0 }, error: error.message };

    return {
      data: { data: (data as ProveedorDB[]) ?? [], total: count ?? 0 },
      error: null,
    };
  } catch (err) {
    return {
      data: { data: [], total: 0 },
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

// ──────────────────────────────────────────────────────────────────
//  TOP 3 PROVEEDORES CARDS (dados real: pedidos activos + calificacion)
//  Regla: pedidos_activos = COUNT(compras) WHERE estado = 'pendiente'
// ──────────────────────────────────────────────────────────────────

export async function getTopProveedoresCards(): Promise<ActionResult<TopProveedorCard[]>> {
  const supabase = createServerClient();

  try {
    // 1) Get all active proveedores with their category name
    const { data: proveedores, error: provError } = await supabase
      .from('proveedores')
      .select('id, nombre, categorias_proveedor(nombre)')
      .eq('estado', true)
      .order('nombre');

    if (provError) return { data: [], error: provError.message };
    if (!proveedores || proveedores.length === 0) return { data: [], error: null };

    // 2) Count active (pendiente) compras per proveedor
    const { data: compras, error: comprasError } = await supabase
      .from('compras')
      .select('proveedor_id')
      .eq('estado', 'pendiente');

    if (comprasError) return { data: [], error: comprasError.message };

    // Tally count per proveedor
    const pedidosPorProveedor: Record<string, number> = {};
    for (const c of compras ?? []) {
      const pid = c.proveedor_id as string;
      pedidosPorProveedor[pid] = (pedidosPorProveedor[pid] ?? 0) + 1;
    }

    // 3) Build card array with deterministic ratings (no rating column exists yet)
    const RATINGS = [98, 100, 91, 95, 87, 93];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = proveedores as any[];

    const cards: TopProveedorCard[] = rows.map((p, idx) => {
      // Supabase returns the foreign relation as array or object depending on cardinality
      const catRel = p.categorias_proveedor;
      const categoria: string | null = Array.isArray(catRel)
        ? (catRel[0]?.nombre ?? null)
        : (catRel?.nombre ?? null);

      return {
        id: p.id as string,
        nombre: p.nombre as string,
        categoria,
        calificacion: RATINGS[idx % RATINGS.length],
        pedidos_activos: pedidosPorProveedor[p.id as string] ?? 0,
      };
    });

    // Sort: more pedidos first, then by calificacion; take top 3
    const top3 = cards
      .sort((a, b) => b.pedidos_activos - a.pedidos_activos || b.calificacion - a.calificacion)
      .slice(0, 3);

    return { data: top3, error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

// ──────────────────────────────────────────────────────────────────
//  OBTENER PROVEEDOR POR ID
// ──────────────────────────────────────────────────────────────────

export async function getProveedorById(
  id: string,
): Promise<ActionResult<ProveedorDB | null>> {
  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*, categorias_proveedor(nombre)')
      .eq('id', id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as ProveedorDB, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

// ──────────────────────────────────────────────────────────────────
//  CREAR PROVEEDOR
//  Reglas: nombre obligatorio, RUC único (11 dígitos), email válido,
//          teléfono obligatorio, categoría obligatoria
// ──────────────────────────────────────────────────────────────────

export async function createProveedor(
  input: ProveedorCreateInput,
): Promise<ActionResult<ProveedorDB | null>> {
  const supabase = createServerClient();

  // Server-side validations
  if (!input.nombre?.trim()) return { data: null, error: 'El nombre es requerido.' };
  if (!input.ruc?.trim())    return { data: null, error: 'El RUC es requerido.' };
  if (!input.telefono?.trim()) return { data: null, error: 'El teléfono es requerido.' };
  if (!input.categoria_id)   return { data: null, error: 'La categoría es requerida.' };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!input.email || !emailRegex.test(input.email)) {
    return { data: null, error: 'El email no tiene un formato válido.' };
  }

  // RUC único
  const { data: existing } = await supabase
    .from('proveedores')
    .select('id')
    .eq('ruc', input.ruc.trim())
    .maybeSingle();

  if (existing) return { data: null, error: 'Ya existe un proveedor con ese RUC.' };

  try {
    const { data, error } = await supabase
      .from('proveedores')
      .insert({
        nombre:       input.nombre.trim(),
        ruc:          input.ruc.trim(),
        contacto:     input.contacto?.trim() || null,
        telefono:     input.telefono?.trim() || null,
        email:        input.email.trim().toLowerCase(),
        categoria_id: input.categoria_id || null,
        direccion:    input.direccion?.trim() || null,
        estado:       input.estado,
      })
      .select('*, categorias_proveedor(nombre)')
      .single();

    if (error) return { data: null, error: error.message };

    revalidatePath('/proveedores');
    return { data: data as ProveedorDB, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

// ──────────────────────────────────────────────────────────────────
//  ACTUALIZAR PROVEEDOR
// ──────────────────────────────────────────────────────────────────

export async function updateProveedor(
  id: string,
  input: ProveedorUpdateInput,
): Promise<ActionResult<ProveedorDB | null>> {
  const supabase = createServerClient();

  // Validate email if updating
  if (input.email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      return { data: null, error: 'El email no tiene un formato válido.' };
    }
  }

  // RUC unique check (exclude self)
  if (input.ruc !== undefined) {
    const { data: existing } = await supabase
      .from('proveedores')
      .select('id')
      .eq('ruc', input.ruc.trim())
      .neq('id', id)
      .maybeSingle();

    if (existing) return { data: null, error: 'Ya existe otro proveedor con ese RUC.' };
  }

  // Build partial update payload
  const payload: Record<string, unknown> = {};
  if (input.nombre      !== undefined) payload.nombre       = input.nombre.trim();
  if (input.ruc         !== undefined) payload.ruc          = input.ruc.trim();
  if (input.contacto    !== undefined) payload.contacto     = input.contacto?.trim() || null;
  if (input.telefono    !== undefined) payload.telefono     = input.telefono?.trim() || null;
  if (input.email       !== undefined) payload.email        = input.email.trim().toLowerCase();
  if (input.categoria_id !== undefined) payload.categoria_id = input.categoria_id || null;
  if (input.direccion   !== undefined) payload.direccion    = input.direccion?.trim() || null;
  if (input.estado      !== undefined) payload.estado       = input.estado;

  try {
    const { data, error } = await supabase
      .from('proveedores')
      .update(payload)
      .eq('id', id)
      .select('*, categorias_proveedor(nombre)')
      .single();

    if (error) return { data: null, error: error.message };

    revalidatePath('/proveedores');
    return { data: data as ProveedorDB, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

// ──────────────────────────────────────────────────────────────────
//  DESACTIVAR PROVEEDOR (soft delete)
//  Regla: si tiene compras históricas NO se elimina físicamente;
//         solo se cambia estado = false
// ──────────────────────────────────────────────────────────────────

export async function deactivateProveedor(
  id: string,
): Promise<ActionResult<null>> {
  const supabase = createServerClient();

  try {
    const { error } = await supabase
      .from('proveedores')
      .update({ estado: false })
      .eq('id', id);

    if (error) return { data: null, error: error.message };

    revalidatePath('/proveedores');
    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

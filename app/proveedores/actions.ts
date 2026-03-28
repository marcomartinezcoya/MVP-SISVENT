'use server';

import { createServerClient } from '@/lib/supabase/server';
import {
  CategoriaProveedorDB,
  ProveedorDB,
  ProveedorCreateInput,
  ProveedorUpdateInput,
  ProveedorStats,
} from '@/lib/types/proveedor';

// Re-export a generic result wrapper (same pattern as productos)
export interface ActionResult<T> {
  data: T;
  error: string | null;
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
      query = query.or(
        `nombre.ilike.%${q}%,contacto.ilike.%${q}%,email.ilike.%${q}%`,
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
//  STATS (total, activos, inactivos)
// ──────────────────────────────────────────────────────────────────

export async function getProveedorStats(): Promise<ActionResult<ProveedorStats>> {
  const supabase = createServerClient();
  const defaultStats: ProveedorStats = {
    totalProveedores: 0,
    proveedoresActivos: 0,
    proveedoresInactivos: 0,
  };

  try {
    const { data, error } = await supabase
      .from('proveedores')
      .select('estado');

    if (error) return { data: defaultStats, error: error.message };

    const rows = data as { estado: boolean }[];
    const activos = rows.filter((r) => r.estado === true).length;
    const inactivos = rows.filter((r) => r.estado === false).length;

    return {
      data: {
        totalProveedores: rows.length,
        proveedoresActivos: activos,
        proveedoresInactivos: inactivos,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: defaultStats,
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
//  Valida RUC único y formato de email antes de insertar.
// ──────────────────────────────────────────────────────────────────

export async function createProveedor(
  input: ProveedorCreateInput,
): Promise<ActionResult<ProveedorDB | null>> {
  const supabase = createServerClient();

  // Validación de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    return { data: null, error: 'El email no tiene un formato válido.' };
  }

  // Verificar RUC único
  const { data: existing } = await supabase
    .from('proveedores')
    .select('id')
    .eq('ruc', input.ruc.trim())
    .maybeSingle();

  if (existing) {
    return { data: null, error: 'Ya existe un proveedor con ese RUC.' };
  }

  try {
    const { data, error } = await supabase
      .from('proveedores')
      .insert({
        nombre:      input.nombre.trim(),
        ruc:         input.ruc.trim(),
        contacto:    input.contacto?.trim() || null,
        telefono:    input.telefono?.trim() || null,
        email:       input.email.trim().toLowerCase(),
        categoria_id: input.categoria_id || null,
        direccion:   input.direccion?.trim() || null,
        estado:      input.estado,
      })
      .select('*, categorias_proveedor(nombre)')
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
//  ACTUALIZAR PROVEEDOR
// ──────────────────────────────────────────────────────────────────

export async function updateProveedor(
  id: string,
  input: ProveedorUpdateInput,
): Promise<ActionResult<ProveedorDB | null>> {
  const supabase = createServerClient();

  // Validación de email si se está actualizando
  if (input.email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      return { data: null, error: 'El email no tiene un formato válido.' };
    }
  }

  // Verificar RUC único (excluyendo el proveedor actual)
  if (input.ruc !== undefined) {
    const { data: existing } = await supabase
      .from('proveedores')
      .select('id')
      .eq('ruc', input.ruc.trim())
      .neq('id', id)
      .maybeSingle();

    if (existing) {
      return { data: null, error: 'Ya existe otro proveedor con ese RUC.' };
    }
  }

  // Build update payload (only include defined fields)
  const payload: Record<string, unknown> = {};
  if (input.nombre    !== undefined) payload.nombre      = input.nombre.trim();
  if (input.ruc       !== undefined) payload.ruc         = input.ruc.trim();
  if (input.contacto  !== undefined) payload.contacto    = input.contacto?.trim() || null;
  if (input.telefono  !== undefined) payload.telefono    = input.telefono?.trim() || null;
  if (input.email     !== undefined) payload.email       = input.email.trim().toLowerCase();
  if (input.categoria_id !== undefined) payload.categoria_id = input.categoria_id || null;
  if (input.direccion !== undefined) payload.direccion   = input.direccion?.trim() || null;
  if (input.estado    !== undefined) payload.estado      = input.estado;

  try {
    const { data, error } = await supabase
      .from('proveedores')
      .update(payload)
      .eq('id', id)
      .select('*, categorias_proveedor(nombre)')
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
//  DESACTIVAR PROVEEDOR (soft delete — NO eliminar)
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
    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

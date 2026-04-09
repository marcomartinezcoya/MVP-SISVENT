'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import {
  ClienteDB,
  ClienteCreateInput,
  ClienteUpdateInput,
  GetClientesParams,
} from '@/lib/types/cliente';

// ══════════════════════════════════════════════════════════════════
//  Generic result wrapper
// ══════════════════════════════════════════════════════════════════

export interface ActionResult<T> {
  data: T;
  error: string | null;
}

// ══════════════════════════════════════════════════════════════════
//  STATS — Clientes Activos
// ══════════════════════════════════════════════════════════════════

export interface ClientesStats {
  activos: number;
}

export async function getClientesStats(): Promise<ActionResult<ClientesStats>> {
  const supabase = createServerClient();
  try {
    const { count, error } = await supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true })
      .eq('estado', true);

    if (error) return { data: { activos: 0 }, error: error.message };
    return { data: { activos: count ?? 0 }, error: null };
  } catch (err) {
    return {
      data: { activos: 0 },
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

// ══════════════════════════════════════════════════════════════════
//  LISTAR CLIENTES (paginación + búsqueda server-side)
// ══════════════════════════════════════════════════════════════════

export interface GetClientesResult {
  data: ClienteDB[];
  total: number;
}

export async function getClientes({
  page = 1,
  limit = 6,
  search = '',
}: GetClientesParams = {}): Promise<ActionResult<GetClientesResult>> {
  const supabase = createServerClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from('clientes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search.trim()) {
      const q = search.trim();
      query = query.or(
        `nombres.ilike.%${q}%,apellidos.ilike.%${q}%,razon_social.ilike.%${q}%,email.ilike.%${q}%,documento.ilike.%${q}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) return { data: { data: [], total: 0 }, error: error.message };
    return {
      data: { data: (data as ClienteDB[]) ?? [], total: count ?? 0 },
      error: null,
    };
  } catch (err) {
    return {
      data: { data: [], total: 0 },
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

// ══════════════════════════════════════════════════════════════════
//  LOAD MORE — carga incremental (offset-based)
// ══════════════════════════════════════════════════════════════════

export async function loadMoreClientes(
  offset: number,
  limit: number = 6,
  search: string = '',
): Promise<ActionResult<ClienteDB[]>> {
  const supabase = createServerClient();
  const to = offset + limit - 1;

  try {
    let query = supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, to);

    if (search.trim()) {
      const q = search.trim();
      query = query.or(
        `nombres.ilike.%${q}%,apellidos.ilike.%${q}%,razon_social.ilike.%${q}%,email.ilike.%${q}%,documento.ilike.%${q}%`,
      );
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: (data as ClienteDB[]) ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

// ══════════════════════════════════════════════════════════════════
//  CREAR CLIENTE
//  Reglas: tipo obligatorio, documento único, teléfono obligatorio,
//          email válido si proporcionado
// ══════════════════════════════════════════════════════════════════

export async function createCliente(
  input: ClienteCreateInput,
): Promise<ActionResult<ClienteDB | null>> {
  const supabase = createServerClient();

  // ── Validaciones server-side ─────────────────────────────────────
  if (!input.tipo_cliente) {
    return { data: null, error: 'El tipo de cliente es requerido.' };
  }
  if (input.tipo_cliente === 'empresa' && !input.razon_social?.trim()) {
    return { data: null, error: 'La razón social es requerida para empresas.' };
  }
  if (input.tipo_cliente === 'persona' && !input.nombres?.trim()) {
    return { data: null, error: 'El nombre es requerido para personas.' };
  }
  if (!input.documento?.trim()) {
    return { data: null, error: 'El documento es requerido.' };
  }
  if (!input.telefono?.trim()) {
    return { data: null, error: 'El teléfono es requerido.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (input.email && !emailRegex.test(input.email)) {
    return { data: null, error: 'El email no tiene un formato válido.' };
  }

  // ── Documento único ───────────────────────────────────────────────
  const { data: existing } = await supabase
    .from('clientes')
    .select('id')
    .eq('documento', input.documento.trim())
    .maybeSingle();

  if (existing) {
    return { data: null, error: 'Ya existe un cliente con ese documento.' };
  }

  try {
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        tipo_cliente: input.tipo_cliente,
        nombres:      input.nombres?.trim() || null,
        apellidos:    input.apellidos?.trim() || null,
        razon_social: input.razon_social?.trim() || null,
        documento:    input.documento.trim(),
        telefono:     input.telefono.trim(),
        email:        input.email?.trim().toLowerCase() || null,
        direccion:    input.direccion?.trim() || null,
        foto_url:     input.foto_url || null,
        estado:       input.estado ?? true,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    revalidatePath('/clientes');
    return { data: data as ClienteDB, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

// ══════════════════════════════════════════════════════════════════
//  ACTUALIZAR CLIENTE
// ══════════════════════════════════════════════════════════════════

export async function updateCliente(
  id: string,
  input: ClienteUpdateInput,
): Promise<ActionResult<ClienteDB | null>> {
  const supabase = createServerClient();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (input.email !== undefined && input.email && !emailRegex.test(input.email)) {
    return { data: null, error: 'El email no tiene un formato válido.' };
  }

  const payload: Record<string, unknown> = {};
  if (input.nombres     !== undefined) payload.nombres      = input.nombres?.trim() || null;
  if (input.apellidos   !== undefined) payload.apellidos    = input.apellidos?.trim() || null;
  if (input.razon_social !== undefined) payload.razon_social = input.razon_social?.trim() || null;
  if (input.telefono    !== undefined) payload.telefono     = input.telefono.trim();
  if (input.email       !== undefined) payload.email        = input.email?.trim().toLowerCase() || null;
  if (input.direccion   !== undefined) payload.direccion    = input.direccion?.trim() || null;
  if (input.foto_url    !== undefined) payload.foto_url     = input.foto_url || null;
  if (input.estado      !== undefined) payload.estado       = input.estado;

  try {
    const { data, error } = await supabase
      .from('clientes')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    revalidatePath('/clientes');
    return { data: data as ClienteDB, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

// ══════════════════════════════════════════════════════════════════
//  SOFT DELETE — marcar estado = false
//  Si tiene ventas históricas no se elimina físicamente
// ══════════════════════════════════════════════════════════════════

export async function deactivateCliente(
  id: string,
): Promise<ActionResult<null>> {
  const supabase = createServerClient();

  try {
    const { error } = await supabase
      .from('clientes')
      .update({ estado: false })
      .eq('id', id);

    if (error) return { data: null, error: error.message };

    revalidatePath('/clientes');
    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

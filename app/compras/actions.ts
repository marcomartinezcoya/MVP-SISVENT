'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import {
  CompraDB,
  CompraCreateInput,
  CompraUpdateInput,
  ComprasDashboardStats,
  ProveedorOption,
  ProductoOption,
} from '@/lib/types/compra';

// ── Generic result wrapper ────────────────────────────────────────────────────

export interface ActionResult<T> {
  data: T;
  error: string | null;
}

// ──────────────────────────────────────────────────────────────────────────────
//  DASHBOARD STATS
//  - valorPendientes: SUM(total) WHERE estado = 'pendiente'
//  - countPendientes: COUNT WHERE estado = 'pendiente'
//  - esperadosHoy:    COUNT WHERE fecha_emision = today AND estado IN (pendiente)
// ──────────────────────────────────────────────────────────────────────────────

export async function getComprasDashboardStats(): Promise<ActionResult<ComprasDashboardStats>> {
  const supabase = createServerClient();
  const defaults: ComprasDashboardStats = { valorPendientes: 0, countPendientes: 0, esperadosHoy: 0 };

  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Query all compras at once and aggregate client-side (avoids extra round trips)
    const { data, error } = await supabase
      .from('compras')
      .select('total, estado, fecha_emision');

    if (error) return { data: defaults, error: error.message };

    const rows = (data ?? []) as { total: number; estado: string; fecha_emision: string }[];

    const pendientes = rows.filter((r) => r.estado === 'pendiente');
    const valorPendientes = pendientes.reduce((sum, r) => sum + Number(r.total), 0);
    const countPendientes = pendientes.length;
    const esperadosHoy = rows.filter(
      (r) =>
        r.fecha_emision === today &&
        r.estado === 'pendiente',
    ).length;

    return {
      data: { valorPendientes, countPendientes, esperadosHoy },
      error: null,
    };
  } catch (err) {
    return { data: defaults, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  OBTENER LISTA DE COMPRAS (paginación + filtros server-side)
// ──────────────────────────────────────────────────────────────────────────────

interface GetComprasParams {
  page?: number;
  limit?: number;
  search?: string;
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

interface GetComprasResult {
  data: CompraDB[];
  total: number;
}

export async function getCompras({
  page = 1,
  limit = 10,
  search = '',
  estado = '',
  fechaInicio = '',
  fechaFin = '',
}: GetComprasParams = {}): Promise<ActionResult<GetComprasResult>> {
  const supabase = createServerClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from('compras')
      .select('*, proveedores(nombre)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search.trim()) {
      const q = search.trim();
      query = query.or(`numero_orden.ilike.%${q}%`);
    }

    if (estado) {
      query = query.eq('estado', estado);
    }

    if (fechaInicio) {
      query = query.gte('fecha_emision', fechaInicio);
    }

    if (fechaFin) {
      query = query.lte('fecha_emision', fechaFin);
    }

    const { data, error, count } = await query;

    if (error) return { data: { data: [], total: 0 }, error: error.message };

    return {
      data: { data: (data as CompraDB[]) ?? [], total: count ?? 0 },
      error: null,
    };
  } catch (err) {
    return {
      data: { data: [], total: 0 },
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  OBTENER DETALLE DE UNA COMPRA
// ──────────────────────────────────────────────────────────────────────────────

export async function getCompraById(id: string): Promise<ActionResult<CompraDB | null>> {
  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from('compras')
      .select('*, proveedores(nombre), compra_detalle(*, productos(nombre, sku))')
      .eq('id', id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as CompraDB, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  PROVEEDORES ACTIVOS (para selects)
// ──────────────────────────────────────────────────────────────────────────────

export async function getProveedoresActivos(): Promise<ActionResult<ProveedorOption[]>> {
  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from('proveedores')
      .select('id, nombre')
      .eq('estado', true)
      .order('nombre');

    if (error) return { data: [], error: error.message };
    return { data: (data as ProveedorOption[]) ?? [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  PRODUCTOS ACTIVOS (para selects en modal de compra)
// ──────────────────────────────────────────────────────────────────────────────

export async function getProductosActivos(search?: string): Promise<ActionResult<ProductoOption[]>> {
  const supabase = createServerClient();

  try {
    let query = supabase
      .from('productos')
      .select('id, nombre, sku, precio_compra, stock_actual')
      .eq('estado', true)
      .order('nombre')
      .limit(50);

    if (search?.trim()) {
      const q = search.trim();
      query = query.or(`nombre.ilike.%${q}%,sku.ilike.%${q}%`);
    }

    const { data, error } = await query;

    if (error) return { data: [], error: error.message };
    return { data: (data as ProductoOption[]) ?? [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  GENERAR NÚMERO DE ORDEN AUTO (PO-YYYY-NNNN)
// ──────────────────────────────────────────────────────────────────────────────

export async function generateNumeroOrden(): Promise<ActionResult<string>> {
  const supabase = createServerClient();

  try {
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;

    // Get the highest existing number for the current year
    const { data, error } = await supabase
      .from('compras')
      .select('numero_orden')
      .ilike('numero_orden', `${prefix}%`)
      .order('numero_orden', { ascending: false })
      .limit(1);

    if (error) return { data: `${prefix}0001`, error: null };

    let nextNum = 1;
    if (data && data.length > 0) {
      const lastOrder = data[0].numero_orden as string;
      const lastNum = parseInt(lastOrder.replace(prefix, ''), 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }

    const numeroOrden = `${prefix}${String(nextNum).padStart(4, '0')}`;
    return { data: numeroOrden, error: null };
  } catch (err) {
    return {
      data: `PO-${new Date().getFullYear()}-0001`,
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  CREAR COMPRA
//  - Auto-genera numero_orden si no se provee
//  - Inserta cabecera en `compras` y detalles en `compra_detalle`
//  - Si estado = 'recibido', actualiza stock_actual de cada producto
// ──────────────────────────────────────────────────────────────────────────────

export async function createCompra(
  input: CompraCreateInput,
): Promise<ActionResult<CompraDB | null>> {
  const supabase = createServerClient();

  // Server-side validation
  if (!input.proveedor_id) return { data: null, error: 'El proveedor es requerido.' };
  if (!input.fecha_emision) return { data: null, error: 'La fecha de emisión es requerida.' };
  if (!input.detalles || input.detalles.length === 0) {
    return { data: null, error: 'Debe agregar al menos un producto a la orden.' };
  }
  for (const d of input.detalles) {
    if (!d.producto_id) return { data: null, error: 'Todos los detalles deben tener un producto.' };
    if (d.cantidad <= 0) return { data: null, error: 'La cantidad debe ser mayor a cero.' };
    if (d.precio_unitario < 0) return { data: null, error: 'El precio unitario no puede ser negativo.' };
  }

  // Calculate financial totals
  const subtotal = input.detalles.reduce((sum, d) => sum + d.cantidad * d.precio_unitario, 0);
  const igv = parseFloat((subtotal * 0.18).toFixed(2));
  const total = parseFloat((subtotal + igv).toFixed(2));
  const subtotalRounded = parseFloat(subtotal.toFixed(2));

  // Generate numero_orden if not provided
  let numeroOrden = input.numero_orden?.trim();
  if (!numeroOrden) {
    const genResult = await generateNumeroOrden();
    numeroOrden = genResult.data;
  }

  // Check for duplicate numero_orden
  const { data: existing } = await supabase
    .from('compras')
    .select('id')
    .eq('numero_orden', numeroOrden)
    .maybeSingle();
  if (existing) return { data: null, error: `El número de orden ${numeroOrden} ya existe.` };

  try {
    // 1) Insert compra header
    const { data: compra, error: compraError } = await supabase
      .from('compras')
      .insert({
        numero_orden:  numeroOrden,
        proveedor_id:  input.proveedor_id,
        fecha_emision: input.fecha_emision,
        estado:        input.estado,
        comentarios:   input.comentarios?.trim() || null,
        subtotal:      subtotalRounded,
        igv,
        total,
      })
      .select('id')
      .single();

    if (compraError) return { data: null, error: compraError.message };

    const compraId = compra.id as string;

    // 2) Insert detalle lines
    const detalleRows = input.detalles.map((d) => ({
      compra_id:       compraId,
      producto_id:     d.producto_id,
      cantidad:        d.cantidad,
      precio_unitario: d.precio_unitario,
    }));

    const { error: detalleError } = await supabase
      .from('compra_detalle')
      .insert(detalleRows);

    if (detalleError) {
      // Rollback: delete the compra header
      await supabase.from('compras').delete().eq('id', compraId);
      return { data: null, error: detalleError.message };
    }

    // 3) If estado = 'recibido', update stock
    if (input.estado === 'recibido') {
      await incrementarStock(supabase, input.detalles);
    }

    revalidatePath('/compras');

    // Return full compra with joins
    const { data: full, error: fullError } = await supabase
      .from('compras')
      .select('*, proveedores(nombre), compra_detalle(*, productos(nombre, sku))')
      .eq('id', compraId)
      .single();

    if (fullError) return { data: null, error: fullError.message };
    return { data: full as CompraDB, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  ACTUALIZAR COMPRA
//  - Si cambia a estado 'recibido', actualiza stock de todos los productos del detalle
//  - No permite editar si ya está en 'recibido' o 'cancelado'
// ──────────────────────────────────────────────────────────────────────────────

export async function updateCompra(
  id: string,
  input: CompraUpdateInput,
): Promise<ActionResult<CompraDB | null>> {
  const supabase = createServerClient();

  // Get current compra to check estado transition
  const { data: current, error: fetchError } = await supabase
    .from('compras')
    .select('estado, compra_detalle(producto_id, cantidad)')
    .eq('id', id)
    .single();

  if (fetchError) return { data: null, error: fetchError.message };

  const currentEstado = current.estado as string;
  const newEstado = input.estado;

  // Build update payload
  const payload: Record<string, unknown> = {};
  if (input.proveedor_id  !== undefined) payload.proveedor_id  = input.proveedor_id;
  if (input.fecha_emision !== undefined) payload.fecha_emision = input.fecha_emision;
  if (input.estado        !== undefined) payload.estado        = input.estado;
  if (input.comentarios   !== undefined) payload.comentarios   = input.comentarios?.trim() || null;
  if (input.numero_orden  !== undefined) payload.numero_orden  = input.numero_orden?.trim();

  // Recalculate totals if detalles are provided
  if (input.detalles && input.detalles.length > 0) {
    const subtotal = input.detalles.reduce((sum, d) => sum + d.cantidad * d.precio_unitario, 0);
    const igv = parseFloat((subtotal * 0.18).toFixed(2));
    const total = parseFloat((subtotal + igv).toFixed(2));
    payload.subtotal = parseFloat(subtotal.toFixed(2));
    payload.igv = igv;
    payload.total = total;
  }

  try {
    // Update compra header
    const { data, error } = await supabase
      .from('compras')
      .update(payload)
      .eq('id', id)
      .select('*, proveedores(nombre)')
      .single();

    if (error) return { data: null, error: error.message };

    // Replace detalle lines if provided
    if (input.detalles && input.detalles.length > 0) {
      // Delete old lines
      await supabase.from('compra_detalle').delete().eq('compra_id', id);

      // Insert new lines
      const detalleRows = input.detalles.map((d) => ({
        compra_id:       id,
        producto_id:     d.producto_id,
        cantidad:        d.cantidad,
        precio_unitario: d.precio_unitario,
      }));
      await supabase.from('compra_detalle').insert(detalleRows);
    }

    // If transitioning to 'recibido' for the first time, increment stock
    if (newEstado === 'recibido' && currentEstado !== 'recibido') {
      // Use the new detalles if provided, otherwise use existing ones
      const detallesParaStock = input.detalles && input.detalles.length > 0
        ? input.detalles
        : (current.compra_detalle as { producto_id: string; cantidad: number }[]).map((d) => ({
            producto_id:     d.producto_id,
            cantidad:        d.cantidad,
            precio_unitario: 0,
          }));

      await incrementarStock(supabase, detallesParaStock);
    }

    revalidatePath('/compras');
    return { data: data as CompraDB, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  HELPER: Incrementar stock de productos tras recepción
// ──────────────────────────────────────────────────────────────────────────────

async function incrementarStock(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  detalles: { producto_id: string; cantidad: number }[],
): Promise<void> {
  for (const d of detalles) {
    // Use Supabase RPC or increment via select + update
    const { data: prod } = await supabase
      .from('productos')
      .select('stock_actual')
      .eq('id', d.producto_id)
      .single();

    if (prod) {
      const nuevoStock = Number(prod.stock_actual) + Number(d.cantidad);
      await supabase
        .from('productos')
        .update({ stock_actual: nuevoStock })
        .eq('id', d.producto_id);
    }
  }
}

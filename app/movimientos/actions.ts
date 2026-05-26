'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import {
  MovimientoDB,
  MovimientoCreateInput,
  MovimientoUpdateInput,
  MovimientosStats,
  MovimientoHistoricoItem,
  DistribucionTipo,
  ProductoMovimientoOption,
  GetMovimientosParams,
  TipoMovimiento,
} from '@/lib/types/movimiento';

// ── Generic result wrapper ────────────────────────────────────────────────────

export interface ActionResult<T> {
  data: T;
  error: string | null;
}

// ──────────────────────────────────────────────────────────────────────────────
//  GENERAR CÓDIGO AUTOMÁTICO (MOV-000001)
// ──────────────────────────────────────────────────────────────────────────────

export async function generateCodigoMovimiento(): Promise<ActionResult<string>> {
  const supabase = createServerClient();
  const prefix = 'MOV-';

  try {
    const { data, error } = await supabase
      .from('movimientos')
      .select('codigo_movimiento')
      .ilike('codigo_movimiento', `${prefix}%`)
      .order('codigo_movimiento', { ascending: false })
      .limit(1);

    if (error) return { data: `${prefix}000001`, error: null };

    let nextNum = 1;
    if (data && data.length > 0 && data[0].codigo_movimiento) {
      const lastCode = data[0].codigo_movimiento as string;
      const lastNum = parseInt(lastCode.replace(prefix, ''), 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }

    return {
      data: `${prefix}${String(nextNum).padStart(6, '0')}`,
      error: null,
    };
  } catch (err) {
    return {
      data: `${prefix}000001`,
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  STATS DEL DASHBOARD
// ──────────────────────────────────────────────────────────────────────────────

export async function getMovimientosStats(): Promise<ActionResult<MovimientosStats>> {
  const supabase = createServerClient();
  const defaults: MovimientosStats = { totalMovimientos: 0, entradasHoy: 0, salidasHoy: 0 };

  try {
    const today = new Date().toISOString().split('T')[0];

    const [totalResult, entradasResult, salidasResult] = await Promise.all([
      supabase.from('movimientos').select('*', { count: 'exact', head: true }).eq('estado', true),
      supabase
        .from('movimientos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', true)
        .eq('tipo_movimiento', 'ENTRADA')
        .gte('fecha_registro', today + 'T00:00:00')
        .lte('fecha_registro', today + 'T23:59:59'),
      supabase
        .from('movimientos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', true)
        .eq('tipo_movimiento', 'SALIDA')
        .gte('fecha_registro', today + 'T00:00:00')
        .lte('fecha_registro', today + 'T23:59:59'),
    ]);

    return {
      data: {
        totalMovimientos: totalResult.count ?? 0,
        entradasHoy: entradasResult.count ?? 0,
        salidasHoy: salidasResult.count ?? 0,
      },
      error: null,
    };
  } catch (err) {
    return { data: defaults, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  HISTÓRICO MENSUAL (últimos 12 meses)
// ──────────────────────────────────────────────────────────────────────────────

export async function getMovimientosHistorico(): Promise<ActionResult<MovimientoHistoricoItem[]>> {
  const supabase = createServerClient();

  try {
    const now = new Date();
    // Only fetch the last 12 months instead of all records
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();

    const { data, error } = await supabase
      .from('movimientos')
      .select('tipo_movimiento, fecha_registro')
      .eq('estado', true)
      .gte('fecha_registro', twelveMonthsAgo)
      .order('fecha_registro', { ascending: false });

    if (error) return { data: [], error: error.message };

    const months: MovimientoHistoricoItem[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('es-PE', { month: 'short' });

      const monthRows = (data ?? []).filter(
        (r) => r.fecha_registro && r.fecha_registro.startsWith(monthKey),
      );

      months.push({
        month: monthLabel,
        total: monthRows.length,
        entradas: monthRows.filter((r) => r.tipo_movimiento === 'ENTRADA').length,
        salidas: monthRows.filter((r) => r.tipo_movimiento === 'SALIDA').length,
      });
    }

    return { data: months, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  DISTRIBUCIÓN POR TIPO
// ──────────────────────────────────────────────────────────────────────────────

export async function getDistribucionMovimientos(): Promise<ActionResult<DistribucionTipo[]>> {
  const supabase = createServerClient();

  try {
    const tipos: TipoMovimiento[] = ['ENTRADA', 'SALIDA', 'TRANSFERENCIA', 'AJUSTE'];

    // 4 COUNT queries in parallel — no rows transferred, just headers
    const results = await Promise.all(
      tipos.map((tipo) =>
        supabase
          .from('movimientos')
          .select('*', { count: 'exact', head: true })
          .eq('estado', true)
          .eq('tipo_movimiento', tipo),
      ),
    );

    const total = results.reduce((sum, r) => sum + (r.count ?? 0), 0);
    if (total === 0) return { data: [], error: null };

    const distribucion: DistribucionTipo[] = results
      .map((r, i) => ({
        tipo: tipos[i],
        count: r.count ?? 0,
        porcentaje: Math.round(((r.count ?? 0) / total) * 100),
      }))
      .filter((d) => d.count > 0);

    return { data: distribucion, error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  LISTAR MOVIMIENTOS (paginados + filtros)
// ──────────────────────────────────────────────────────────────────────────────

export interface GetMovimientosResult {
  data: MovimientoDB[];
  total: number;
}

export async function getMovimientos({
  page = 1,
  limit = 10,
  search = '',
  tipo = '',
  fechaInicio = '',
  fechaFin = '',
}: GetMovimientosParams = {}): Promise<ActionResult<GetMovimientosResult>> {
  const supabase = createServerClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from('movimientos')
      .select('*, productos(nombre, sku, stock_actual, precio_compra)', { count: 'exact' })
      .eq('estado', true)
      .order('fecha_registro', { ascending: false })
      .range(from, to);

    if (search.trim()) {
      const q = search.trim();
      query = query.or(
        `codigo_movimiento.ilike.%${q}%,referencia.ilike.%${q}%,motivo.ilike.%${q}%`,
      );
    }

    if (tipo) {
      query = query.eq('tipo_movimiento', tipo);
    }

    if (fechaInicio) {
      query = query.gte('fecha_registro', fechaInicio);
    }

    if (fechaFin) {
      // Include the full day
      query = query.lte('fecha_registro', fechaFin + 'T23:59:59');
    }

    const { data, error, count } = await query;

    if (error) return { data: { data: [], total: 0 }, error: error.message };
    return {
      data: { data: (data as MovimientoDB[]) ?? [], total: count ?? 0 },
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
//  OBTENER MOVIMIENTO POR ID
// ──────────────────────────────────────────────────────────────────────────────

export async function getMovimientoById(id: string): Promise<ActionResult<MovimientoDB | null>> {
  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from('movimientos')
      .select('*, productos(nombre, sku, stock_actual, precio_compra)')
      .eq('id', id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as MovimientoDB, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  PRODUCTOS ACTIVOS (para el buscador del modal)
// ──────────────────────────────────────────────────────────────────────────────

export async function getProductosMovimiento(
  search?: string,
): Promise<ActionResult<ProductoMovimientoOption[]>> {
  const supabase = createServerClient();

  try {
    let query = supabase
      .from('productos')
      .select('id, nombre, sku, stock_actual, precio_compra')
      .eq('estado', true)
      .order('nombre')
      .limit(50);

    if (search?.trim()) {
      const q = search.trim();
      query = query.or(`nombre.ilike.%${q}%,sku.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: (data as ProductoMovimientoOption[]) ?? [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  CREAR MOVIMIENTO
//  Reglas de negocio:
//    ENTRADA      → aumenta stock
//    SALIDA       → valida stock disponible, descuenta
//    AJUSTE       → aplica positivo o negativo
//    TRANSFERENCIA → solo registra trazabilidad, no cambia stock global
// ──────────────────────────────────────────────────────────────────────────────

export async function createMovimiento(
  input: MovimientoCreateInput,
): Promise<ActionResult<MovimientoDB | null>> {
  const supabase = createServerClient();

  // ── Server-side validations ──────────────────────────────────────────────────
  if (!input.producto_id) return { data: null, error: 'El producto es requerido.' };
  if (!input.tipo_movimiento) return { data: null, error: 'El tipo de movimiento es requerido.' };
  if (input.cantidad === 0) return { data: null, error: 'La cantidad no puede ser cero.' };
  if (!input.motivo?.trim()) return { data: null, error: 'El motivo es requerido.' };

  // SALIDA: validate stock
  if (input.tipo_movimiento === 'SALIDA') {
    const cantidadSalida = Math.abs(input.cantidad);
    const { data: prod, error: prodError } = await supabase
      .from('productos')
      .select('stock_actual, nombre')
      .eq('id', input.producto_id)
      .single();

    if (prodError || !prod) {
      return { data: null, error: 'Producto no encontrado.' };
    }

    if (Number(prod.stock_actual) < cantidadSalida) {
      return {
        data: null,
        error: `Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock_actual}, Solicitado: ${cantidadSalida}`,
      };
    }
  }

  // AJUSTE with negative: validate stock too
  if (input.tipo_movimiento === 'AJUSTE' && input.cantidad < 0) {
    const cantidadAjuste = Math.abs(input.cantidad);
    const { data: prod } = await supabase
      .from('productos')
      .select('stock_actual, nombre')
      .eq('id', input.producto_id)
      .single();

    if (prod && Number(prod.stock_actual) < cantidadAjuste) {
      return {
        data: null,
        error: `El ajuste negativo excede el stock disponible de "${prod.nombre}". Stock: ${prod.stock_actual}`,
      };
    }
  }

  // Generate codes
  const codeResult = await generateCodigoMovimiento();
  const codigoMovimiento = codeResult.data;

  const valorTotal = Math.abs(input.cantidad) * Math.abs(input.costo_unitario);
  const fechaRegistro = input.fecha_registro ?? new Date().toISOString();

  try {
    // 1) Insert movement record
    const { data: movimiento, error: insertError } = await supabase
      .from('movimientos')
      .insert({
        codigo_movimiento: codigoMovimiento,
        producto_id:       input.producto_id,
        tipo_movimiento:   input.tipo_movimiento,
        origen:            input.origen?.trim() || 'Ajuste Manual',
        destino:           input.destino?.trim() || null,
        referencia:        input.referencia?.trim() || null,
        motivo:            input.motivo.trim(),
        cantidad:          input.cantidad,
        costo_unitario:    Math.abs(input.costo_unitario),
        valor_total:       valorTotal,
        fecha_registro:    fechaRegistro,
        estado:            true,
      })
      .select('*, productos(nombre, sku, stock_actual, precio_compra)')
      .single();

    if (insertError) return { data: null, error: insertError.message };

    // 2) Update stock based on type
    await actualizarStock(supabase, input.producto_id, input.tipo_movimiento, input.cantidad);

    revalidatePath('/movimientos');
    revalidatePath('/productos');

    return { data: movimiento as MovimientoDB, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  ACTUALIZAR MOVIMIENTO (solo campos descriptivos, no cantidad — inmutable)
// ──────────────────────────────────────────────────────────────────────────────

export async function updateMovimiento(
  id: string,
  input: MovimientoUpdateInput,
): Promise<ActionResult<MovimientoDB | null>> {
  const supabase = createServerClient();

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.motivo !== undefined) payload.motivo = input.motivo.trim();
  if (input.referencia !== undefined) payload.referencia = input.referencia?.trim() || null;
  if (input.estado !== undefined) payload.estado = input.estado;

  try {
    const { data, error } = await supabase
      .from('movimientos')
      .update(payload)
      .eq('id', id)
      .select('*, productos(nombre, sku, stock_actual, precio_compra)')
      .single();

    if (error) return { data: null, error: error.message };

    revalidatePath('/movimientos');
    return { data: data as MovimientoDB, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  SOFT DELETE — marca estado = false
// ──────────────────────────────────────────────────────────────────────────────

export async function deleteMovimiento(id: string): Promise<ActionResult<null>> {
  const supabase = createServerClient();

  try {
    const { error } = await supabase
      .from('movimientos')
      .update({ estado: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { data: null, error: error.message };

    revalidatePath('/movimientos');
    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  HELPER: actualizar stock según tipo de movimiento
// ──────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function actualizarStock(
  supabase: ReturnType<typeof createServerClient>,
  productoId: string,
  tipo: TipoMovimiento,
  cantidad: number,
): Promise<void> {
  // TRANSFERENCIA → no modifica stock global
  if (tipo === 'TRANSFERENCIA') return;

  const { data: prod } = await supabase
    .from('productos')
    .select('stock_actual')
    .eq('id', productoId)
    .single();

  if (!prod) return;

  const stockActual = Number(prod.stock_actual);
  let nuevoStock: number;

  if (tipo === 'ENTRADA') {
    // Positive quantity increases stock
    nuevoStock = stockActual + Math.abs(cantidad);
  } else if (tipo === 'SALIDA') {
    // Reduce stock (never below 0)
    nuevoStock = Math.max(0, stockActual - Math.abs(cantidad));
  } else if (tipo === 'AJUSTE') {
    // Can be positive or negative
    nuevoStock = Math.max(0, stockActual + cantidad);
  } else {
    return;
  }

  await supabase
    .from('productos')
    .update({ stock_actual: nuevoStock })
    .eq('id', productoId);
}

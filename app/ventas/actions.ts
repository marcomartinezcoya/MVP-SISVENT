'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import {
  VentaDB,
  VentaCreateInput,
  VentaUpdateInput,
  VentaStats,
  ClienteOption,
  ProductoVentaOption,
} from '@/lib/types/venta';

// ── Generic result wrapper ────────────────────────────────────────────────────

export interface ActionResult<T> {
  data: T;
  error: string | null;
}

// ──────────────────────────────────────────────────────────────────────────────
//  DASHBOARD STATS
//  - ventaMes: SUM(total) WHERE estado = 'completado' AND current month
//  - ventaDia: SUM(total) WHERE estado = 'completado' AND today
//  - totalOperaciones: COUNT total
// ──────────────────────────────────────────────────────────────────────────────

export async function getVentasStats(): Promise<ActionResult<VentaStats>> {
  const supabase = createServerClient();
  const defaults: VentaStats = { ventaMes: 0, ventaDia: 0, totalOperaciones: 0 };

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const [mesResult, diaResult, totalResult] = await Promise.all([
      supabase
        .from('ventas')
        .select('total')
        .eq('estado', 'completado')
        .gte('fecha_emision', firstOfMonth),
      supabase
        .from('ventas')
        .select('total')
        .eq('estado', 'completado')
        .eq('fecha_emision', today),
      supabase.from('ventas').select('*', { count: 'exact', head: true }),
    ]);

    if (mesResult.error) return { data: defaults, error: mesResult.error.message };

    const ventaMes = (mesResult.data ?? []).reduce((s, r) => s + Number(r.total), 0);
    const ventaDia = (diaResult.data ?? []).reduce((s, r) => s + Number(r.total), 0);
    const totalOperaciones = totalResult.count ?? 0;

    return { data: { ventaMes, ventaDia, totalOperaciones }, error: null };
  } catch (err) {
    return { data: defaults, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  OBTENER LISTA DE VENTAS (paginación + filtros server-side)
// ──────────────────────────────────────────────────────────────────────────────

interface GetVentasParams {
  page?: number;
  limit?: number;
  search?: string;
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

interface GetVentasResult {
  data: VentaDB[];
  total: number;
}

export async function getVentas({
  page = 1,
  limit = 10,
  search = '',
  estado = '',
  fechaInicio = '',
  fechaFin = '',
}: GetVentasParams = {}): Promise<ActionResult<GetVentasResult>> {
  const supabase = createServerClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from('ventas')
      .select('*, clientes(tipo_cliente, nombres, apellidos, razon_social, documento)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search.trim()) {
      const q = search.trim();
      // Search in codigo_venta OR via client name/doc using a joined filter approach
      // Since Supabase doesn't support OR across joins easily, we do codigo_venta first
      // For client-side name search we use textSearch on joined fields
      query = query.or(
        `codigo_venta.ilike.%${q}%,clientes.razon_social.ilike.%${q}%,clientes.nombres.ilike.%${q}%,clientes.apellidos.ilike.%${q}%,clientes.documento.ilike.%${q}%`
      );
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
      data: { data: (data as VentaDB[]) ?? [], total: count ?? 0 },
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
//  OBTENER DETALLE DE UNA VENTA
// ──────────────────────────────────────────────────────────────────────────────

export async function getVentaById(id: string): Promise<ActionResult<VentaDB | null>> {
  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from('ventas')
      .select('*, clientes(tipo_cliente, nombres, apellidos, razon_social, documento, email, telefono, direccion), venta_detalle(*, productos(nombre, sku))')
      .eq('id', id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as VentaDB, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  CLIENTES ACTIVOS (para selects)
// ──────────────────────────────────────────────────────────────────────────────

export async function getClientesActivos(): Promise<ActionResult<ClienteOption[]>> {
  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, tipo_cliente, nombres, apellidos, razon_social, documento')
      .eq('estado', true)
      .order('nombres')
      .limit(500);

    if (error) return { data: [], error: error.message };
    return { data: (data as ClienteOption[]) ?? [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  PRODUCTOS ACTIVOS (para selects – con precio_venta y stock)
// ──────────────────────────────────────────────────────────────────────────────

export async function getProductosVenta(search?: string): Promise<ActionResult<ProductoVentaOption[]>> {
  const supabase = createServerClient();

  try {
    let query = supabase
      .from('productos')
      .select('id, nombre, sku, precio_venta, stock_actual')
      .eq('estado', true)
      .order('nombre')
      .limit(50);

    if (search?.trim()) {
      const q = search.trim();
      query = query.or(`nombre.ilike.%${q}%,sku.ilike.%${q}%`);
    }

    const { data, error } = await query;

    if (error) return { data: [], error: error.message };
    return { data: (data as ProductoVentaOption[]) ?? [], error: null };
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  GENERAR CÓDIGO DE VENTA AUTO (SL-000001)
// ──────────────────────────────────────────────────────────────────────────────

export async function generateCodigoVenta(): Promise<ActionResult<string>> {
  const supabase = createServerClient();

  try {
    const prefix = 'SL-';

    const { data, error } = await supabase
      .from('ventas')
      .select('codigo_venta')
      .ilike('codigo_venta', `${prefix}%`)
      .order('codigo_venta', { ascending: false })
      .limit(1);

    if (error) return { data: `${prefix}000001`, error: null };

    let nextNum = 1;
    if (data && data.length > 0) {
      const lastCode = data[0].codigo_venta as string;
      const lastNum = parseInt(lastCode.replace(prefix, ''), 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }

    const codigoVenta = `${prefix}${String(nextNum).padStart(6, '0')}`;
    return { data: codigoVenta, error: null };
  } catch (err) {
    return {
      data: 'SL-000001',
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  CREAR VENTA
//  - Auto-genera codigo_venta si no se provee
//  - Si estado = 'completado': valida stock, descuenta, registra movimiento SALIDA
//  - Si estado = 'pendiente': no toca stock
// ──────────────────────────────────────────────────────────────────────────────

export async function createVenta(
  input: VentaCreateInput,
): Promise<ActionResult<VentaDB | null>> {
  const supabase = createServerClient();

  // Server-side validation
  if (!input.cliente_id) return { data: null, error: 'El cliente es requerido.' };
  if (!input.fecha_emision) return { data: null, error: 'La fecha de emisión es requerida.' };
  if (!input.detalles || input.detalles.length === 0) {
    return { data: null, error: 'Debe agregar al menos un producto a la venta.' };
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

  // Generate codigo_venta if not provided
  let codigoVenta = input.codigo_venta?.trim();
  if (!codigoVenta) {
    const genResult = await generateCodigoVenta();
    codigoVenta = genResult.data;
  }

  // Check duplicate
  const { data: existing } = await supabase
    .from('ventas')
    .select('id')
    .eq('codigo_venta', codigoVenta)
    .maybeSingle();
  if (existing) return { data: null, error: `El código de venta ${codigoVenta} ya existe.` };

  // Validate stock if completado
  if (input.estado === 'completado') {
    for (const d of input.detalles) {
      const { data: prod, error: prodError } = await supabase
        .from('productos')
        .select('stock_actual, nombre')
        .eq('id', d.producto_id)
        .single();

      if (prodError || !prod) {
        return { data: null, error: `Producto no encontrado: ${d.producto_id}` };
      }

      if (Number(prod.stock_actual) < d.cantidad) {
        return {
          data: null,
          error: `Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock_actual}, Solicitado: ${d.cantidad}`,
        };
      }
    }
  }

  try {
    // 1) Insert venta header
    const { data: venta, error: ventaError } = await supabase
      .from('ventas')
      .insert({
        codigo_venta:  codigoVenta,
        cliente_id:    input.cliente_id,
        fecha_emision: input.fecha_emision,
        estado:        input.estado,
        observaciones: input.observaciones?.trim() || null,
        subtotal:      subtotalRounded,
        igv,
        total,
      })
      .select('id')
      .single();

    if (ventaError) return { data: null, error: ventaError.message };

    const ventaId = venta.id as string;

    // 2) Insert detalle lines
    const detalleRows = input.detalles.map((d) => ({
      venta_id:        ventaId,
      producto_id:     d.producto_id,
      cantidad:        d.cantidad,
      precio_unitario: d.precio_unitario,
    }));

    const { error: detalleError } = await supabase
      .from('venta_detalle')
      .insert(detalleRows);

    if (detalleError) {
      // Rollback: delete the venta header
      await supabase.from('ventas').delete().eq('id', ventaId);
      return { data: null, error: detalleError.message };
    }

    // 3) If estado = 'completado', deduct stock + register movements
    if (input.estado === 'completado') {
      await descontarStock(supabase, input.detalles, codigoVenta!);
    }

    revalidatePath('/ventas');

    // Return full venta with joins
    const { data: full, error: fullError } = await supabase
      .from('ventas')
      .select('*, clientes(tipo_cliente, nombres, apellidos, razon_social, documento), venta_detalle(*, productos(nombre, sku))')
      .eq('id', ventaId)
      .single();

    if (fullError) return { data: null, error: fullError.message };
    return { data: full as VentaDB, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  ACTUALIZAR VENTA
//  - Si cambia a 'completado' desde otro estado: valida y descuenta stock
//  - Si cambia a 'anulado' desde 'completado': devuelve stock
// ──────────────────────────────────────────────────────────────────────────────

export async function updateVenta(
  id: string,
  input: VentaUpdateInput,
): Promise<ActionResult<VentaDB | null>> {
  const supabase = createServerClient();

  // Get current venta
  const { data: current, error: fetchError } = await supabase
    .from('ventas')
    .select('estado, codigo_venta, venta_detalle(producto_id, cantidad)')
    .eq('id', id)
    .single();

  if (fetchError) return { data: null, error: fetchError.message };

  const currentEstado = current.estado as string;
  const newEstado = input.estado ?? currentEstado;
  const codigoVenta = current.codigo_venta as string;

  // Build update payload
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.cliente_id !== undefined) payload.cliente_id = input.cliente_id;
  if (input.fecha_emision !== undefined) payload.fecha_emision = input.fecha_emision;
  if (input.estado !== undefined) payload.estado = input.estado;
  if (input.observaciones !== undefined) payload.observaciones = input.observaciones?.trim() || null;

  // Recalculate totals if detalles are provided
  if (input.detalles && input.detalles.length > 0) {
    const subtotal = input.detalles.reduce((sum, d) => sum + d.cantidad * d.precio_unitario, 0);
    const igv = parseFloat((subtotal * 0.18).toFixed(2));
    const total = parseFloat((subtotal + igv).toFixed(2));
    payload.subtotal = parseFloat(subtotal.toFixed(2));
    payload.igv = igv;
    payload.total = total;
  }

  // Determine which detalles to use for stock ops
  const detallesForStock = input.detalles && input.detalles.length > 0
    ? input.detalles
    : (current.venta_detalle as { producto_id: string; cantidad: number }[]).map((d) => ({
        producto_id: d.producto_id,
        cantidad: d.cantidad,
        precio_unitario: 0,
      }));

  // Validate stock if transitioning to completado
  if (newEstado === 'completado' && currentEstado !== 'completado') {
    for (const d of detallesForStock) {
      const { data: prod, error: prodError } = await supabase
        .from('productos')
        .select('stock_actual, nombre')
        .eq('id', d.producto_id)
        .single();

      if (prodError || !prod) {
        return { data: null, error: `Producto no encontrado.` };
      }

      if (Number(prod.stock_actual) < d.cantidad) {
        return {
          data: null,
          error: `Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock_actual}, Solicitado: ${d.cantidad}`,
        };
      }
    }
  }

  try {
    // Update venta header
    const { error } = await supabase
      .from('ventas')
      .update(payload)
      .eq('id', id);

    if (error) return { data: null, error: error.message };

    // Replace detalle lines if provided
    if (input.detalles && input.detalles.length > 0) {
      await supabase.from('venta_detalle').delete().eq('venta_id', id);

      const detalleRows = input.detalles.map((d) => ({
        venta_id:        id,
        producto_id:     d.producto_id,
        cantidad:        d.cantidad,
        precio_unitario: d.precio_unitario,
      }));
      await supabase.from('venta_detalle').insert(detalleRows);
    }

    // Stock transitions
    if (newEstado === 'completado' && currentEstado !== 'completado') {
      // Transitioning TO completado → deduct stock
      await descontarStock(supabase, detallesForStock, codigoVenta);
    } else if (newEstado === 'anulado' && currentEstado === 'completado') {
      // Transitioning FROM completado TO anulado → return stock
      await devolverStock(supabase, detallesForStock, codigoVenta);
    }

    revalidatePath('/ventas');

    const { data: full, error: fullError } = await supabase
      .from('ventas')
      .select('*, clientes(tipo_cliente, nombres, apellidos, razon_social, documento), venta_detalle(*, productos(nombre, sku))')
      .eq('id', id)
      .single();

    if (fullError) return { data: null, error: fullError.message };
    return { data: full as VentaDB, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  ANULAR VENTA (shortcut)
//  - Si estaba completado → devuelve stock + registra movimientos ENTRADA
//  - Si estaba pendiente → solo cambia estado
// ──────────────────────────────────────────────────────────────────────────────

export async function anularVenta(id: string): Promise<ActionResult<VentaDB | null>> {
  const supabase = createServerClient();

  const { data: current, error: fetchError } = await supabase
    .from('ventas')
    .select('estado, codigo_venta, venta_detalle(producto_id, cantidad)')
    .eq('id', id)
    .single();

  if (fetchError) return { data: null, error: fetchError.message };

  const currentEstado = current.estado as string;
  if (currentEstado === 'anulado') {
    return { data: null, error: 'Esta venta ya está anulada.' };
  }

  try {
    const { error } = await supabase
      .from('ventas')
      .update({ estado: 'anulado', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { data: null, error: error.message };

    // Return stock if was completado
    if (currentEstado === 'completado') {
      const detalles = (current.venta_detalle as { producto_id: string; cantidad: number }[]).map((d) => ({
        producto_id: d.producto_id,
        cantidad: d.cantidad,
        precio_unitario: 0,
      }));
      await devolverStock(supabase, detalles, current.codigo_venta as string);
    }

    revalidatePath('/ventas');

    const { data: full, error: fullError } = await supabase
      .from('ventas')
      .select('*, clientes(tipo_cliente, nombres, apellidos, razon_social, documento), venta_detalle(*, productos(nombre, sku))')
      .eq('id', id)
      .single();

    if (fullError) return { data: null, error: fullError.message };
    return { data: full as VentaDB, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  HELPERS: Stock management + movimientos
// ──────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function descontarStock(
  supabase: any,
  detalles: { producto_id: string; cantidad: number }[],
  codigoVenta: string,
): Promise<void> {
  if (!detalles.length) return;

  const productIds = detalles.map((d) => d.producto_id);

  const [prodsResult, lastMovResult] = await Promise.all([
    supabase.from('productos').select('id, stock_actual').in('id', productIds),
    supabase
      .from('movimientos')
      .select('codigo_movimiento')
      .ilike('codigo_movimiento', 'MOV-%')
      .order('codigo_movimiento', { ascending: false })
      .limit(1),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prodMap = new Map<string, any>((prodsResult.data ?? []).map((p: any) => [p.id, p]));
  const lastNum = lastMovResult.data?.[0]?.codigo_movimiento
    ? parseInt(lastMovResult.data[0].codigo_movimiento.replace('MOV-', ''), 10)
    : 0;

  const fechaRegistro = new Date().toISOString();
  const movimientosInserts: object[] = [];

  await Promise.all(
    detalles.map(async (d, i) => {
      const prod = prodMap.get(d.producto_id);
      if (!prod) return;

      const nuevoStock = Math.max(0, Number(prod.stock_actual) - Number(d.cantidad));
      await supabase.from('productos').update({ stock_actual: nuevoStock }).eq('id', d.producto_id);

      movimientosInserts.push({
        codigo_movimiento: `MOV-${String(lastNum + i + 1).padStart(6, '0')}`,
        producto_id:       d.producto_id,
        tipo_movimiento:   'SALIDA',
        origen:            'Almacén Principal',
        destino:           'Cliente',
        referencia:        codigoVenta,
        motivo:            `Venta completada — ${codigoVenta}`,
        cantidad:          -d.cantidad,
        costo_unitario:    0,
        valor_total:       0,
        fecha_registro:    fechaRegistro,
        estado:            true,
      });
    }),
  );

  if (movimientosInserts.length > 0) {
    await supabase.from('movimientos').insert(movimientosInserts);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function devolverStock(
  supabase: any,
  detalles: { producto_id: string; cantidad: number }[],
  codigoVenta: string,
): Promise<void> {
  if (!detalles.length) return;

  const productIds = detalles.map((d) => d.producto_id);

  const [prodsResult, lastMovResult] = await Promise.all([
    supabase.from('productos').select('id, stock_actual').in('id', productIds),
    supabase
      .from('movimientos')
      .select('codigo_movimiento')
      .ilike('codigo_movimiento', 'MOV-%')
      .order('codigo_movimiento', { ascending: false })
      .limit(1),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prodMap = new Map<string, any>((prodsResult.data ?? []).map((p: any) => [p.id, p]));
  const lastNum = lastMovResult.data?.[0]?.codigo_movimiento
    ? parseInt(lastMovResult.data[0].codigo_movimiento.replace('MOV-', ''), 10)
    : 0;

  const fechaRegistro = new Date().toISOString();
  const movimientosInserts: object[] = [];

  await Promise.all(
    detalles.map(async (d, i) => {
      const prod = prodMap.get(d.producto_id);
      if (!prod) return;

      const nuevoStock = Number(prod.stock_actual) + Number(d.cantidad);
      await supabase.from('productos').update({ stock_actual: nuevoStock }).eq('id', d.producto_id);

      movimientosInserts.push({
        codigo_movimiento: `MOV-${String(lastNum + i + 1).padStart(6, '0')}`,
        producto_id:       d.producto_id,
        tipo_movimiento:   'ENTRADA',
        origen:            'Devolución Cliente',
        destino:           'Almacén Principal',
        referencia:        codigoVenta,
        motivo:            `Devolución por anulación — ${codigoVenta}`,
        cantidad:          d.cantidad,
        costo_unitario:    0,
        valor_total:       0,
        fecha_registro:    fechaRegistro,
        estado:            true,
      });
    }),
  );

  if (movimientosInserts.length > 0) {
    await supabase.from('movimientos').insert(movimientosInserts);
  }
}

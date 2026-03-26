'use server';

import { createServerClient } from '@/lib/supabase/server';
import {
  Producto,
  ProductoCreateInput,
  ProductoUpdateInput,
  ProductoStats,
  ActionResult,
} from '@/lib/types/producto';

// ──────────────────────────────────────────────────────────────────
//  OBTENER LISTA DE PRODUCTOS (con paginación y filtros)
// ──────────────────────────────────────────────────────────────────

interface GetProductosParams {
  page?: number;
  limit?: number;
  search?: string;
  categoria?: string;
}

interface GetProductosResult {
  data: Producto[];
  total: number;
}

export async function getProductos({
  page = 1,
  limit = 10,
  search = '',
  categoria = '',
}: GetProductosParams = {}): Promise<ActionResult<GetProductosResult>> {
  const supabase = createServerClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from('productos')
      .select('*', { count: 'exact' })
      .eq('estado', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search.trim()) {
      query = query.or(
        `nombre.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%`,
      );
    }

    if (categoria && categoria !== 'Todas') {
      query = query.eq('categoria', categoria);
    }

    const { data, error, count } = await query;

    if (error) return { data: { data: [], total: 0 }, error: error.message };

    return {
      data: { data: (data as Producto[]) ?? [], total: count ?? 0 },
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
//  PÁGINA INICIAL: productos + stats en un solo Server Action
//  Reduces 3 DB round-trips on mount to 2 parallel queries.
// ──────────────────────────────────────────────────────────────────

export interface GetProductosPageResult {
  productos: GetProductosResult;
  stats: ProductoStats;
}

export async function getProductosPage(
  params: GetProductosParams = {},
): Promise<ActionResult<GetProductosPageResult>> {
  const supabase = createServerClient();

  const defaultStats: ProductoStats = {
    totalSKUs: 0,
    totalValue: 0,
    criticalAlerts: 0,
    lowStockItems: 0,
  };

  const { page = 1, limit = 10, search = '', categoria = '' } = params;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    // Ejecutar ambas consultas en paralelo
    let productosQuery = supabase
      .from('productos')
      .select('*', { count: 'exact' })
      .eq('estado', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search.trim()) {
      productosQuery = productosQuery.or(
        `nombre.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%`,
      );
    }
    if (categoria && categoria !== 'Todas') {
      productosQuery = productosQuery.eq('categoria', categoria);
    }

    const [productosResult, statsResult] = await Promise.all([
      productosQuery,
      supabase.rpc('get_producto_stats'),
    ]);

    // Produtos
    if (productosResult.error) {
      return {
        data: { productos: { data: [], total: 0 }, stats: defaultStats },
        error: productosResult.error.message,
      };
    }

    // Stats — la RPC ahora existe, pero añadimos fallback defensivo
    let stats = defaultStats;
    if (!statsResult.error && statsResult.data) {
      const raw = Array.isArray(statsResult.data)
        ? statsResult.data[0]
        : statsResult.data;
      stats = {
        totalSKUs: Number(raw?.totalSKUs ?? 0),
        totalValue: Number(raw?.totalValue ?? 0),
        criticalAlerts: Number(raw?.criticalAlerts ?? 0),
        lowStockItems: Number(raw?.lowStockItems ?? 0),
      };
    }

    return {
      data: {
        productos: {
          data: (productosResult.data as Producto[]) ?? [],
          total: productosResult.count ?? 0,
        },
        stats,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: { productos: { data: [], total: 0 }, stats: defaultStats },
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

// ──────────────────────────────────────────────────────────────────
//  STATS (usado en actualizaciones post-edición)
// ──────────────────────────────────────────────────────────────────

export async function getProductoStats(): Promise<ActionResult<ProductoStats>> {
  const supabase = createServerClient();

  const defaultStats: ProductoStats = {
    totalSKUs: 0,
    totalValue: 0,
    criticalAlerts: 0,
    lowStockItems: 0,
  };

  try {
    const { data, error } = await supabase.rpc('get_producto_stats');
    if (error || !data) return { data: defaultStats, error: error?.message ?? null };

    const raw = Array.isArray(data) ? data[0] : data;
    return {
      data: {
        totalSKUs: Number(raw?.totalSKUs ?? 0),
        totalValue: Number(raw?.totalValue ?? 0),
        criticalAlerts: Number(raw?.criticalAlerts ?? 0),
        lowStockItems: Number(raw?.lowStockItems ?? 0),
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
//  OBTENER PRODUCTO POR ID
// ──────────────────────────────────────────────────────────────────

export async function getProductoById(
  id: string,
): Promise<ActionResult<Producto | null>> {
  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Producto, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

// ──────────────────────────────────────────────────────────────────
//  CREAR PRODUCTO
//  El SKU se genera automáticamente en la DB (trigger + secuencia).
// ──────────────────────────────────────────────────────────────────

export async function createProducto(
  input: ProductoCreateInput,
): Promise<ActionResult<Producto | null>> {
  const supabase = createServerClient();

  if (input.precio_venta < input.precio_compra) {
    return {
      data: null,
      error: 'El precio de venta no puede ser menor al precio de compra.',
    };
  }

  try {
    const { data, error } = await supabase
      .from('productos')
      .insert({
        nombre: input.nombre.trim(),
        categoria: input.categoria,
        precio_compra: input.precio_compra,
        precio_venta: input.precio_venta,
        stock_actual: input.stock_actual,
        stock_minimo: input.stock_minimo,
        imagen_url: input.imagen_url || null,
        estado: input.estado,
        // Omitimos sku: la DB lo genera automáticamente vía trigger
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Producto, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

// ──────────────────────────────────────────────────────────────────
//  ACTUALIZAR PRODUCTO
//  El SKU no se modifica (readonly). stock_actual se actualiza directo.
// ──────────────────────────────────────────────────────────────────

export async function updateProducto(
  id: string,
  input: ProductoUpdateInput,
): Promise<ActionResult<Producto | null>> {
  const supabase = createServerClient();

  if (input.precio_venta < input.precio_compra) {
    return {
      data: null,
      error: 'El precio de venta no puede ser menor al precio de compra.',
    };
  }

  try {
    const { data, error } = await supabase
      .from('productos')
      .update({
        nombre: input.nombre.trim(),
        categoria: input.categoria,
        precio_compra: input.precio_compra,
        precio_venta: input.precio_venta,
        stock_actual: input.stock_actual,
        stock_minimo: input.stock_minimo,
        imagen_url: input.imagen_url || null,
        estado: input.estado,
        // sku no se actualiza – es readonly
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Producto, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Error desconocido',
    };
  }
}

// ──────────────────────────────────────────────────────────────────
//  DESACTIVAR PRODUCTO (soft delete – NO eliminar)
// ──────────────────────────────────────────────────────────────────

export async function deactivateProducto(
  id: string,
): Promise<ActionResult<null>> {
  const supabase = createServerClient();

  try {
    const { error } = await supabase
      .from('productos')
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

// ──────────────────────────────────────────────────────────────────
//  SUBIR IMAGEN AL BUCKET DE STORAGE
//  Recibe el archivo en bytes (number[]) para pasar por Server Action.
//  Retorna la URL pública permanente del archivo.
// ──────────────────────────────────────────────────────────────────

export async function uploadProductImage(
  bytes: number[],
  contentType: string,
  extension: string,
): Promise<ActionResult<string>> {
  const supabase = createServerClient();

  const filename = `${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(bytes);

  try {
    const { error } = await supabase.storage
      .from('productos')
      .upload(filename, buffer, {
        contentType,
        upsert: false,
      });

    if (error) return { data: '', error: error.message };

    const { data: urlData } = supabase.storage
      .from('productos')
      .getPublicUrl(filename);

    return { data: urlData.publicUrl, error: null };
  } catch (err) {
    return {
      data: '',
      error: err instanceof Error ? err.message : 'Error al subir la imagen',
    };
  }
}


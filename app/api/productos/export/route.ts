import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createServerClient } from '@/lib/supabase/server';
import { Producto } from '@/lib/types/producto';
import { calcularEstadoStock } from '@/lib/types/producto';
import { formatSoles } from '@/lib/utils/currency';

// ── Helpers ─────────────────────────────────────────────────────────


function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// ── Route Handler ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const search = searchParams.get('search') ?? '';
  const categoria = searchParams.get('categoria') ?? '';

  const supabase = createServerClient();

  // Consultar TODOS los registros que coincidan con los filtros (sin paginación)
  let query = supabase
    .from('productos')
    .select('*')
    .eq('estado', true)
    .order('created_at', { ascending: false });

  if (search.trim()) {
    query = query.or(
      `nombre.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%`,
    );
  }

  if (categoria && categoria !== 'Todas' && categoria !== '') {
    query = query.eq('categoria', categoria);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const productos = (data ?? []) as Producto[];

  // ── Construir filas del Excel ────────────────────────────────────
  const rows = productos.map((p, idx) => ({
    '#': idx + 1,
    'Código Producto': p.sku,
    'Nombre': p.nombre,
    'Categoría': p.categoria ?? '—',
    'Precio Compra (S/)': formatSoles(p.precio_compra),
    'Precio Venta (S/)': formatSoles(p.precio_venta),
    'Margen (S/)': formatSoles(parseFloat((p.precio_venta - p.precio_compra).toFixed(2))),
    'Stock Actual': p.stock_actual,
    'Stock Mínimo': p.stock_minimo,
    'Estado Stock': calcularEstadoStock(p.stock_actual, p.stock_minimo),
    'Valor Inventario (S/)': formatSoles(parseFloat((p.stock_actual * p.precio_compra).toFixed(2))),
    'URL Imagen': p.imagen_url ?? '',
    'Fecha Registro': formatDate(p.created_at),
  }));

  // ── Crear libro Excel ────────────────────────────────────────────
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Ajustar ancho de columnas automáticamente
  const colWidths = [
    { wch: 5 },   // #
    { wch: 16 },  // Código
    { wch: 32 },  // Nombre
    { wch: 14 },  // Categoría
    { wch: 18 },  // Precio Compra
    { wch: 18 },  // Precio Venta
    { wch: 12 },  // Margen
    { wch: 14 },  // Stock Actual
    { wch: 14 },  // Stock Mínimo
    { wch: 14 },  // Estado Stock
    { wch: 20 },  // Valor Inventario
    { wch: 40 },  // URL Imagen
    { wch: 16 },  // Fecha Registro
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Productos');

  // Generar buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  // Nombre de archivo con fecha
  const fecha = new Date().toISOString().slice(0, 10);
  const sufijo = search || categoria ? '_filtrado' : '_completo';
  const filename = `productos${sufijo}_${fecha}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

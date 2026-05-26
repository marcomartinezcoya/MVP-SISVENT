-- ============================================================
--  SISVENT — Performance Indexes
--  Ejecutar en Supabase > SQL Editor
-- ============================================================

-- ── Extensión trigram (necesaria para ILIKE '%texto%') ────────
-- Permite búsquedas de texto parcial sin full table scan.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── productos ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_productos_estado
  ON productos(estado);

CREATE INDEX IF NOT EXISTS idx_productos_categoria
  ON productos(categoria)
  WHERE estado = true;

CREATE INDEX IF NOT EXISTS idx_productos_created_at
  ON productos(created_at DESC);

-- Para búsqueda ILIKE en nombre y sku
CREATE INDEX IF NOT EXISTS idx_productos_nombre_trgm
  ON productos USING GIN(nombre gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_productos_sku_trgm
  ON productos USING GIN(sku gin_trgm_ops);

-- ── clientes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clientes_estado
  ON clientes(estado);

CREATE INDEX IF NOT EXISTS idx_clientes_nombres_trgm
  ON clientes USING GIN(nombres gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_clientes_documento
  ON clientes(documento);

-- ── proveedores ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_proveedores_estado
  ON proveedores(estado);

-- ── compras ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_compras_estado
  ON compras(estado);

CREATE INDEX IF NOT EXISTS idx_compras_fecha_emision
  ON compras(fecha_emision);

-- Índice compuesto para stats: estado + fecha (cubre ambos filtros en un solo scan)
CREATE INDEX IF NOT EXISTS idx_compras_estado_fecha
  ON compras(estado, fecha_emision);

CREATE INDEX IF NOT EXISTS idx_compras_created_at
  ON compras(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_compras_numero_orden
  ON compras(numero_orden);

CREATE INDEX IF NOT EXISTS idx_compras_proveedor_id
  ON compras(proveedor_id);

-- ── compra_detalle ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_compra_detalle_compra_id
  ON compra_detalle(compra_id);

CREATE INDEX IF NOT EXISTS idx_compra_detalle_producto_id
  ON compra_detalle(producto_id);

-- ── ventas ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ventas_estado
  ON ventas(estado);

CREATE INDEX IF NOT EXISTS idx_ventas_fecha_emision
  ON ventas(fecha_emision);

-- Índice compuesto para stats: estado + fecha
CREATE INDEX IF NOT EXISTS idx_ventas_estado_fecha
  ON ventas(estado, fecha_emision);

CREATE INDEX IF NOT EXISTS idx_ventas_created_at
  ON ventas(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ventas_codigo_venta
  ON ventas(codigo_venta);

CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id
  ON ventas(cliente_id);

-- ── venta_detalle ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_venta_detalle_venta_id
  ON venta_detalle(venta_id);

CREATE INDEX IF NOT EXISTS idx_venta_detalle_producto_id
  ON venta_detalle(producto_id);

-- ── movimientos ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_movimientos_estado
  ON movimientos(estado);

CREATE INDEX IF NOT EXISTS idx_movimientos_tipo_movimiento
  ON movimientos(tipo_movimiento);

CREATE INDEX IF NOT EXISTS idx_movimientos_fecha_registro
  ON movimientos(fecha_registro DESC);

-- Índice compuesto para stats/filtros: estado + tipo + fecha
CREATE INDEX IF NOT EXISTS idx_movimientos_estado_tipo_fecha
  ON movimientos(estado, tipo_movimiento, fecha_registro DESC);

CREATE INDEX IF NOT EXISTS idx_movimientos_producto_id
  ON movimientos(producto_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_codigo_movimiento
  ON movimientos(codigo_movimiento);

-- Para búsqueda ILIKE en referencia y motivo
CREATE INDEX IF NOT EXISTS idx_movimientos_referencia_trgm
  ON movimientos USING GIN(referencia gin_trgm_ops);

-- ============================================================
--  VERIFICAR índices creados
-- ============================================================
-- SELECT indexname, tablename FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;

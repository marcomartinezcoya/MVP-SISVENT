export type EstadoCompra = 'Pendiente' | 'Recibido' | 'Cancelado';

export interface SeleccionProveedor {
  id: string;
  nombre: string;
  iniciales: string;
}

export interface DetalleCompraDB {
  id: string;
  compra_id?: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
}

export interface CompraDB {
  id: string;
  codigo_orden: string;
  proveedor: SeleccionProveedor;
  fecha_emision: string;
  estado: EstadoCompra;
  comentarios?: string;
  monto_total: number;
  detalles: DetalleCompraDB[];
}

export const MOCK_PROVEEDORES: SeleccionProveedor[] = [
  { id: 'prov_1', nombre: 'Global Logistics', iniciales: 'GL' },
  { id: 'prov_2', nombre: 'Tech Systems Inc', iniciales: 'TS' },
  { id: 'prov_3', nombre: 'North Prime Ltd', iniciales: 'NP' },
  { id: 'prov_4', nombre: 'Apex Materials', iniciales: 'AM' },
  { id: 'prov_5', nombre: 'ElectroCorp Solutions', iniciales: 'EC' },
  { id: 'prov_6', nombre: 'Volt Supply Co.', iniciales: 'VS' },
  { id: 'prov_7', nombre: 'InduGrid Industrial', iniciales: 'IG' },
];

export const MOCK_COMPRAS: CompraDB[] = [
  {
    id: 'comp_1',
    codigo_orden: 'PO-24901',
    proveedor: { id: 'prov_1', nombre: 'Global Logistics', iniciales: 'GL' },
    fecha_emision: '24 oct, 2023',
    estado: 'Pendiente',
    monto_total: 12450.00,
    detalles: []
  },
  {
    id: 'comp_2',
    codigo_orden: 'PO-24899',
    proveedor: { id: 'prov_2', nombre: 'Tech Systems Inc', iniciales: 'TS' },
    fecha_emision: '22 oct, 2023',
    estado: 'Recibido',
    monto_total: 45200.00,
    detalles: []
  },
  {
    id: 'comp_3',
    codigo_orden: 'PO-24895',
    proveedor: { id: 'prov_3', nombre: 'North Prime Ltd', iniciales: 'NP' },
    fecha_emision: '21 oct, 2023',
    estado: 'Cancelado',
    monto_total: 8900.00,
    detalles: []
  },
  {
    id: 'comp_4',
    codigo_orden: 'PO-24892',
    proveedor: { id: 'prov_4', nombre: 'Apex Materials', iniciales: 'AM' },
    fecha_emision: '20 oct, 2023',
    estado: 'Pendiente',
    monto_total: 3120.00,
    detalles: []
  }
];

// Helper to determine badge colors based on status
export function getEstadoCompraStyle(estado: EstadoCompra) {
  switch (estado) {
    case 'Pendiente':
      return { bg: 'bg-primary/10', text: 'text-primary' };
    case 'Recibido':
      return { bg: 'bg-tertiary/10', text: 'text-tertiary' };
    case 'Cancelado':
      return { bg: 'bg-error/10', text: 'text-error' };
    default:
      return { bg: 'bg-surface-variant', text: 'text-on-surface' };
  }
}

// Emulate initial styles of vendor avatars
export function getProveedorInitialStyle(index: number) {
  const styles = [
    { bg: 'bg-primary/20', text: 'text-primary' },
    { bg: 'bg-secondary/20', text: 'text-secondary' },
    { bg: 'bg-tertiary/20', text: 'text-tertiary' },
    { bg: 'bg-error/20', text: 'text-error' },
  ];
  return styles[index % styles.length];
}

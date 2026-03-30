export interface VentaDB {
  id: string;
  codigo_venta: string;
  cliente: {
    nombre: string;
    iniciales: string;
  };
  fecha_emision: string;
  monto_total: number;
  estado: 'Completado' | 'Pendiente' | 'Cancelado';
}

export interface DetalleVentaDB {
  id: string;
  producto: string;
  sku: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export const MOCK_VENTAS: VentaDB[] = [
  {
    id: 'v1',
    codigo_venta: 'SL-829104',
    cliente: { nombre: 'Marco Sullivan', iniciales: 'MS' },
    fecha_emision: '24 oct, 2023',
    monto_total: 1240.00,
    estado: 'Completado',
  },
  {
    id: 'v2',
    codigo_venta: 'SL-829105',
    cliente: { nombre: 'Lydia Waters', iniciales: 'LW' },
    fecha_emision: '24 oct, 2023',
    monto_total: 450.50,
    estado: 'Pendiente',
  },
  {
    id: 'v3',
    codigo_venta: 'SL-829107',
    cliente: { nombre: 'Elena Kostic', iniciales: 'EK' },
    fecha_emision: '23 oct, 2023',
    monto_total: 3100.00,
    estado: 'Completado',
  },
  {
    id: 'v4',
    codigo_venta: 'SL-829108',
    cliente: { nombre: 'Julian Hart', iniciales: 'JH' },
    fecha_emision: '22 oct, 2023',
    monto_total: 150.00,
    estado: 'Cancelado',
  },
];

export const getEstadoVentaStyle = (estado: VentaDB['estado']) => {
  switch (estado) {
    case 'Completado':
      return { bg: 'bg-tertiary/10', text: 'text-tertiary' };
    case 'Pendiente':
      return { bg: 'bg-primary/10', text: 'text-primary' };
    case 'Cancelado':
      return { bg: 'bg-error/10', text: 'text-error' };
    default:
      return { bg: 'bg-surface-variant', text: 'text-on-surface-variant' };
  }
};

export const getClienteInitialStyle = (index: number) => {
  const styles = [
    { bg: 'bg-primary/20', text: 'text-primary' },
    { bg: 'bg-secondary/20', text: 'text-secondary' },
    { bg: 'bg-surface-container-highest', text: 'text-on-surface-variant' },
    { bg: 'bg-error/20', text: 'text-error' },
  ];
  return styles[index % styles.length];
};

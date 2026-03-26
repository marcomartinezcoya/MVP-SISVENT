// ── Proveedor Type Definitions ─────────────────────────────────────────────

export type CategoriaProveedor =
  | 'Tecnología'
  | 'Materia Prima'
  | 'Hardware'
  | 'Embalaje'
  | 'Oficina'
  | 'Electricidad'
  | 'Servicios'
  | 'Otros';

export type EstadoProveedor = 'activo' | 'inactivo';

export interface Proveedor {
  id: string;
  nombre: string;
  ruc: string;
  contacto: string;
  categoria: CategoriaProveedor;
  telefono: string;
  email: string;
  direccion?: string;
  estado: EstadoProveedor;
  calificacion?: number; // 0-100
  pedidos_activos?: number;
  created_at?: string;
}

export interface ProveedorCreateInput {
  nombre: string;
  ruc: string;
  contacto: string;
  categoria: CategoriaProveedor;
  telefono: string;
  email: string;
  direccion?: string;
  estado: EstadoProveedor;
}

export type ProveedorUpdateInput = Partial<ProveedorCreateInput>;

export interface ProveedorStats {
  totalProveedores: number;
  proveedoresActivos: number;
  categorias: number;
  pedidosActivos: number;
}

// ── Category styling metadata ───────────────────────────────────────────────

export const CATEGORIAS_PROVEEDOR: CategoriaProveedor[] = [
  'Tecnología',
  'Materia Prima',
  'Hardware',
  'Embalaje',
  'Oficina',
  'Electricidad',
  'Servicios',
  'Otros',
];

export type CategoryStyle = {
  bg: string;
  text: string;
  avatarText: string;
};

export const CATEGORIA_STYLES: Record<CategoriaProveedor, CategoryStyle> = {
  Tecnología:    { bg: 'bg-primary/10',   text: 'text-primary',   avatarText: 'text-primary' },
  'Materia Prima': { bg: 'bg-secondary/10', text: 'text-secondary', avatarText: 'text-secondary' },
  Hardware:      { bg: 'bg-primary/10',   text: 'text-primary',   avatarText: 'text-primary' },
  Embalaje:      { bg: 'bg-tertiary/10',  text: 'text-tertiary',  avatarText: 'text-tertiary' },
  Oficina:       { bg: 'bg-secondary/10', text: 'text-secondary', avatarText: 'text-secondary' },
  Electricidad:  { bg: 'bg-tertiary/10',  text: 'text-tertiary',  avatarText: 'text-tertiary' },
  Servicios:     { bg: 'bg-primary/10',   text: 'text-primary',   avatarText: 'text-primary' },
  Otros:         { bg: 'bg-outline/10',   text: 'text-on-surface-variant', avatarText: 'text-on-surface-variant' },
};

// ── Mock Data ───────────────────────────────────────────────────────────────

export const MOCK_PROVEEDORES: Proveedor[] = [
  {
    id: '1',
    nombre: 'TechLogistics Global',
    ruc: '20123456789',
    contacto: 'Carlos Méndez',
    categoria: 'Tecnología',
    telefono: '+51 912 345 678',
    email: 'ventas@techlog.com',
    direccion: 'Av. Javier Prado 1234, San Isidro, Lima',
    estado: 'activo',
    calificacion: 98,
    pedidos_activos: 12,
  },
  {
    id: '2',
    nombre: 'Insumos del Norte',
    ruc: '20234567890',
    contacto: 'Ana Martínez',
    categoria: 'Materia Prima',
    telefono: '+51 931 888 222',
    email: 'contacto@insumosnorte.pe',
    direccion: 'Calle Real 456, Trujillo, La Libertad',
    estado: 'activo',
    calificacion: 92,
    pedidos_activos: 8,
  },
  {
    id: '3',
    nombre: 'Volt & Amp Co.',
    ruc: '20345678901',
    contacto: 'Jordi Pujol',
    categoria: 'Electricidad',
    telefono: '+51 934 555 111',
    email: 'info@voltamp.com.pe',
    direccion: 'Jr. Los Pinos 789, Miraflores, Lima',
    estado: 'inactivo',
    calificacion: 100,
    pedidos_activos: 3,
  },
  {
    id: '4',
    nombre: 'Officenter Perú',
    ruc: '20456789012',
    contacto: 'Lucía Fernández',
    categoria: 'Oficina',
    telefono: '+51 944 777 333',
    email: 'lucia@officenter.pe',
    direccion: 'Av. Arequipa 2000, Lince, Lima',
    estado: 'activo',
    calificacion: 85,
    pedidos_activos: 5,
  },
  {
    id: '5',
    nombre: 'PackSmart SAC',
    ruc: '20567890123',
    contacto: 'Miguel Torres',
    categoria: 'Embalaje',
    telefono: '+51 955 222 444',
    email: 'mtorres@packsmart.pe',
    direccion: 'Av. Colonial 500, Cercado de Lima',
    estado: 'activo',
    calificacion: 91,
    pedidos_activos: 6,
  },
  {
    id: '6',
    nombre: 'Nexus Hardware',
    ruc: '20678901234',
    contacto: 'Sandra Cruz',
    categoria: 'Hardware',
    telefono: '+51 966 111 555',
    email: 'scruz@nexushardware.pe',
    direccion: 'Calle Los Laureles 100, La Molina, Lima',
    estado: 'inactivo',
    calificacion: 79,
    pedidos_activos: 0,
  },
  {
    id: '7',
    nombre: 'ServiLogic Solutions',
    ruc: '20789012345',
    contacto: 'Roberto Quispe',
    categoria: 'Servicios',
    telefono: '+51 977 888 666',
    email: 'rquispe@servilogic.pe',
    direccion: 'Av. Abancay 300, Cercado de Lima',
    estado: 'activo',
    calificacion: 88,
    pedidos_activos: 2,
  },
];

export const MOCK_STATS: ProveedorStats = {
  totalProveedores: MOCK_PROVEEDORES.length,
  proveedoresActivos: MOCK_PROVEEDORES.filter((p) => p.estado === 'activo').length,
  categorias: new Set(MOCK_PROVEEDORES.map((p) => p.categoria)).size,
  pedidosActivos: MOCK_PROVEEDORES.reduce((acc, p) => acc + (p.pedidos_activos ?? 0), 0),
};

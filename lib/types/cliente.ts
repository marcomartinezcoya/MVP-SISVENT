export type ClienteCategoria = 'VIP' | 'Regular' | 'Nuevo';

export interface Cliente {
  id: string;
  nombre: string;
  empresa: string;
  categoria: ClienteCategoria;
  pedidos_totales: number;
  valor_vida: number;
  avatar_url?: string | null;
  ultima_compra?: string | null;
  // Campos del modal
  email: string;
  telefono: string;
  notas?: string;
}

export interface ClienteCreateInput {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  categoria: ClienteCategoria;
  avatar_url?: string | null;
  notas?: string;
}

export interface ClienteUpdateInput extends Partial<ClienteCreateInput> {}

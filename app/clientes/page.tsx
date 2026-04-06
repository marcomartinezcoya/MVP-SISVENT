'use client';

import React, { useState, useMemo } from 'react';
import { Cliente, ClienteCreateInput, ClienteCategoria } from '@/lib/types/cliente';
import { ClienteFormModal } from '@/components/modules/clientes/ClienteFormModal';

const INITIAL_MOCK_CLIENTES: Cliente[] = [
  {
    id: '1',
    nombre: 'Marcus Chen',
    empresa: 'Global Logistics Inc.',
    categoria: 'VIP',
    pedidos_totales: 142,
    valor_vida: 12840,
    ultima_compra: '12 oct 2023',
    avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRjjsjBoy783HD1XMsX48IzqPipceWJB5QprUQTKHC8EFXVGJ87HxkQKXmGTtpT8HkEkCTpV9vgg_q3qkez12uOFtnAqAQdZswM2hqb7L5qc3YuzW6baw9V4_Sdf1-OdjHvIwChIUiliVmCZEeeB_fMruSmN2JnB5z6piiXQUkkffSOazZrgck06gDdKfO3OoTciclk8_eqRnCQ_3WKysi9vXbn7gdoE0zlVKJVB_59TdBiPaOtbxpAhxnet5MRx6WKVmH_cUVYorr',
    email: 'marcus@global.com',
    telefono: '+1 123 456 7890'
  },
  {
    id: '2',
    nombre: 'Sarah Jenkins',
    empresa: 'Boutique Retailers Co.',
    categoria: 'Regular',
    pedidos_totales: 28,
    valor_vida: 3210,
    ultima_compra: '05 oct 2023',
    avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARJD74FBSQ3x_nljbUTTHHHpZF6eq8qI_lZz5UJ82mwgEZuhOTtcSFiMfsJmaEipyquiVUTeFhSRpu6D2ZPmzJL2saKqVKtHTa82dIZlmL_Pn08pSIwJYcbWWWlJZ1553ISThX-2mmVqMT1Mto8ll8jkhOteivWCn9-RJETkjwTwphmGZXUjudhd7HzLXnDLt29hqisHVqGd9vMNy4S0HF3339Hzk8XgFTrJqsfh9SzxzFE7y-0FLTvKGpisRhOtbIe6xhonmyydHb',
    email: 'sarah@boutique.com',
    telefono: '+1 987 654 3210'
  },
  {
    id: '3',
    nombre: 'John Dorsey',
    empresa: 'Consultor Freelance',
    categoria: 'Nuevo',
    pedidos_totales: 1,
    valor_vida: 450,
    ultima_compra: 'Ayer',
    email: 'john@freelance.com',
    telefono: '+1 555 123 4567'
  },
  {
    id: '4',
    nombre: 'Elena Rodriguez',
    empresa: 'Techno Systems Ltd',
    categoria: 'VIP',
    pedidos_totales: 89,
    valor_vida: 9520,
    ultima_compra: '11 oct 2023',
    avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQyAHS1xZCvyz5XQLt_G5555O1vxgA-Ivg15s0YQ4JoLCzh0zKo0wAyngb6hJJOi852RYLRj-WmWniyWxsV7bpeTiFbAapGnP39ZCLg_itHZfcFbWhoyDySboUCTpr4tqCAjgzkWFldS7P3o-9vjngKqQDIjBGIIz0tnOnQRXcskxiU6aOOHrJ0gRspkKEWgfPt-pnU10XKmeVqm1pMEEmpeRdDDkwkBYxA1gpkB-uvC2GsKhFLm4VLJ7wf2VotweCq5TUMKwxyZmT',
    email: 'elena@techno.com',
    telefono: '+1 666 987 6543'
  },
  {
    id: '5',
    nombre: 'Samuel Moore',
    empresa: 'Quick Shipments NV',
    categoria: 'Regular',
    pedidos_totales: 45,
    valor_vida: 5400,
    ultima_compra: '28 sep 2023',
    email: 'samuel@quick.com',
    telefono: '+1 333 444 5555'
  },
  {
    id: '6',
    nombre: 'Laura Palmer',
    empresa: 'Twin Peaks Cafe',
    categoria: 'VIP',
    pedidos_totales: 156,
    valor_vida: 18500,
    ultima_compra: 'Ayer',
    email: 'laura@twinpeaks.com',
    telefono: '+1 500 555 0199'
  }
];

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>(INITIAL_MOCK_CLIENTES);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  const [page, setPage] = useState(1);
  const LIMIT = 6;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const clientesFiltrados = useMemo(() => {
    if (!search.trim()) return clientes;
    const s = search.toLowerCase();
    return clientes.filter(c => 
      c.nombre.toLowerCase().includes(s) || 
      c.empresa.toLowerCase().includes(s)
    );
  }, [clientes, search]);

  const clientesPaginados = useMemo(() => {
    const start = (page - 1) * LIMIT;
    return clientesFiltrados.slice(start, start + LIMIT);
  }, [clientesFiltrados, page]);

  const totalPages = Math.ceil(clientesFiltrados.length / LIMIT);
  const fromItem = clientesFiltrados.length === 0 ? 0 : (page - 1) * LIMIT + 1;
  const toItem = Math.min(page * LIMIT, clientesFiltrados.length);

  const handleOpenNewCliente = () => {
    setSelectedCliente(null);
    setIsModalOpen(true);
  };

  const handleOpenEditCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsModalOpen(true);
  };

  const handleSave = async (data: any, mode: 'create' | 'edit') => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulando carga

    if (mode === 'create') {
      const newCliente: Cliente = {
        id: Math.random().toString(36).substr(2, 9),
        nombre: data.nombre,
        empresa: data.empresa,
        categoria: data.categoria as ClienteCategoria,
        avatar_url: data.avatar_url,
        email: data.email,
        telefono: data.telefono,
        notas: data.notas,
        pedidos_totales: 0,
        valor_vida: 0,
        ultima_compra: 'Ninguna'
      };
      setClientes([newCliente, ...clientes]);
    } else if (mode === 'edit' && selectedCliente) {
      setClientes(clientes.map(c => 
        c.id === selectedCliente.id 
          ? { ...c, ...data, categoria: data.categoria as ClienteCategoria } 
          : c
      ));
    }

    return { success: true };
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Clientes</h2>
          <p className="text-on-surface-variant max-w-md">
            Administra las relaciones con tus clientes y analiza su historial de pedidos.
          </p>
        </div>
        
        <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10 flex flex-col gap-4 relative overflow-hidden group">
          <div className="flex items-center justify-between z-10">
            <span className="text-on-surface-variant font-semibold text-sm uppercase tracking-wider">Clientes Activos</span>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            </div>
          </div>
          <div className="z-10">
            <p className="text-4xl font-extrabold text-on-surface tracking-tighter">1,284</p>
            <p className="text-xs text-tertiary-fixed-dim mt-1 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span> +12% este mes
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mt-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              className="w-full bg-surface-container border border-outline-variant/20 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none"
              placeholder="Buscar por nombre o empresa..."
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button 
            onClick={handleOpenNewCliente}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary-dim to-primary text-on-primary-container font-bold rounded-md shadow-lg shadow-primary/20 active:scale-95 transition-all w-full md:w-auto"
          >
            <span className="material-symbols-outlined text-xl">person_add</span>
            Añadir Cliente
          </button>
        </div>
      </div>

      {/* Customer Bento Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {clientesPaginados.map((cliente) => (
          <div 
            key={cliente.id}
            className={`rounded-xl p-6 bg-surface-container-low border border-outline-variant/10 shadow-xl shadow-black/20 transition-all group ${
              cliente.categoria === 'VIP' ? 'hover:border-primary/30 hover:shadow-primary/5' :
              cliente.categoria === 'Regular' ? 'hover:border-secondary/30 hover:shadow-secondary/5' :
              'hover:border-tertiary/30 hover:shadow-tertiary/5'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
                {cliente.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={cliente.avatar_url} 
                    alt={`Retrato de ${cliente.nombre}`} 
                    className={`w-14 h-14 rounded-2xl object-cover ring-2 ${
                      cliente.categoria === 'VIP' ? 'ring-primary/20' :
                      cliente.categoria === 'Regular' ? 'ring-secondary/20' :
                      'ring-tertiary/20'
                    }`} 
                  />
                ) : (
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border ring-2 ${
                    cliente.categoria === 'VIP' ? 'bg-primary/10 text-primary border-primary/20 ring-primary/5' :
                    cliente.categoria === 'Regular' ? 'bg-secondary/10 text-secondary border-secondary/20 ring-secondary/5' :
                    'bg-tertiary/10 text-tertiary border-tertiary/20 ring-tertiary/5'
                  }`}>
                    {getInitials(cliente.nombre)}
                  </div>
                )}
                
                <div>
                  <h3 className={`font-bold text-lg text-on-surface transition-colors ${
                    cliente.categoria === 'VIP' ? 'group-hover:text-primary' :
                    cliente.categoria === 'Regular' ? 'group-hover:text-secondary' :
                    'group-hover:text-tertiary'
                  }`}>
                    {cliente.nombre}
                  </h3>
                  <p className="text-xs text-on-surface-variant font-medium">{cliente.empresa}</p>
                </div>
              </div>
              
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                cliente.categoria === 'VIP' ? 'bg-primary-container/20 text-primary border-primary/20' :
                cliente.categoria === 'Regular' ? 'bg-secondary-container/10 text-secondary border-secondary/20' :
                'bg-tertiary-container/10 text-tertiary border-tertiary/20'
              }`}>
                {cliente.categoria}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-surface-container-highest p-3 rounded-xl">
                <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Pedidos Totales</p>
                <p className="text-xl font-bold text-on-surface mt-0.5">{cliente.pedidos_totales}</p>
              </div>
              <div className="bg-surface-container-highest p-3 rounded-xl">
                <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Valor de Vida</p>
                <p className="text-xl font-bold text-tertiary mt-0.5">{formatCurrency(cliente.valor_vida)}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs border-t border-outline-variant/10 pt-4">
              <div className="flex items-center gap-2 text-on-surface-variant font-medium">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                Última compra: <span className="text-on-surface">{cliente.ultima_compra}</span>
              </div>
              <button 
                onClick={() => handleOpenEditCliente(cliente)}
                className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors"
                title="Editar Cliente"
              >
                <span className="material-symbols-outlined text-lg text-on-surface">edit</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {clientesFiltrados.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant gap-4 bg-surface-container-low rounded-xl border border-outline-variant/10">
          <span className="material-symbols-outlined text-5xl opacity-40">group_off</span>
          <p className="font-medium">No se encontraron clientes para mostrar</p>
        </div>
      )}

      {/* Pagination Container */}
      {clientesFiltrados.length > 0 && (
        <div className="flex items-center justify-between py-4 px-2">
          <span className="text-xs text-on-surface-variant font-medium">
            Mostrar {fromItem}-{toItem} de {clientesFiltrados.length}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1.5 bg-surface-container-highest rounded-md text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 bg-surface-container-highest rounded-md text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Añadir/Editar */}
      <ClienteFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cliente={selectedCliente}
        onSave={handleSave}
      />
    </div>
  );
}

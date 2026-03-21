import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Product } from '@/app/productos/mockData';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: (product: Omit<Product, 'id' | 'stockPercentage'>) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, product, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Electrónica',
    price: '',
    stock: '',
    status: 'En Stock',
    imageUrl: ''
  });

  useEffect(() => {
    if (product) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: product.price.toString(),
        stock: product.stock.toString(),
        status: product.status,
        imageUrl: product.imageUrl || ''
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: '',
        sku: '',
        category: 'Electrónica',
        price: '',
        stock: '',
        status: 'En Stock',
        imageUrl: ''
      });
    }
  }, [product, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock, 10) || 0,
      status: formData.status as 'En Stock' | 'Bajo Stock' | 'Agotado'
    });
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={product ? 'Editar Producto' : 'Nuevo Producto'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">Nombre del Producto</label>
            <input 
              required
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none placeholder:text-on-surface-variant/50" 
              placeholder="Ej: Laptop XPS 15"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">SKU</label>
            <input 
              required
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none placeholder:text-on-surface-variant/50" 
              placeholder="Ej: TECH-001"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">Categoría</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none appearance-none"
            >
              <option>Electrónica</option>
              <option>Mobiliario</option>
              <option>Hardware</option>
              <option>Suministros</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">Precio Unitario ($)</label>
            <input 
              required
              type="number"
              step="0.01"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none placeholder:text-on-surface-variant/50" 
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">Stock Inicial</label>
            <input 
              required
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none placeholder:text-on-surface-variant/50" 
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">Estado</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none appearance-none"
            >
              <option>En Stock</option>
              <option>Bajo Stock</option>
              <option>Agotado</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">URL de Imagen (Opcional)</label>
            <input 
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none placeholder:text-on-surface-variant/50" 
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/10">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 border border-outline-variant/10 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className="px-5 py-2.5 text-sm font-bold rounded-lg bg-gradient-to-br from-primary-dim to-primary text-on-primary-container hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            {product ? 'Guardar Cambios' : 'Crear Producto'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

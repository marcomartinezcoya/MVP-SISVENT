'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { formatSoles } from '@/lib/utils/currency';

interface EntradaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EntradaModal: React.FC<EntradaModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    producto: '',
    fecha: '2023-10-27',
    cantidad: '',
    motivo: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock calculation values
  const costoPromedio = 45.50;
  const valorTotal = (parseInt(formData.cantidad || '0', 10) * costoPromedio).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 800);
  };

  const handleSuggestionClick = (motivo: string) => {
    setFormData((prev) => ({ ...prev, motivo }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Entrada"
      maxWidth="max-w-2xl"
      icon="warehouse"
      iconBgClass="bg-primary/10"
      iconTextClass="text-primary"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section: Producto y Referencia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Selection */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              Producto <span className="text-error">*</span>
            </label>
            <input 
              name="producto"
              className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none placeholder:text-on-surface-variant/50" 
              placeholder="Buscar producto..." 
              type="text"
              value={formData.producto}
              onChange={e => setFormData({ ...formData, producto: e.target.value })}
              required
            />
          </div>

          {/* Date Selection */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              Fecha de Registro <span className="text-error">*</span>
            </label>
            <input 
              name="fecha"
              className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none [color-scheme:dark]" 
              type="date" 
              value={formData.fecha}
              onChange={e => setFormData({ ...formData, fecha: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Section: Inventory Logic */}
        <div className="bg-surface-container-highest/20 p-5 rounded-lg border border-outline-variant/10">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Quantity Field */}
            <div className="w-full md:w-1/2 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-on-surface-variant">
                  Cantidad de Ajuste <span className="text-error">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-grow">
                    <input 
                      name="cantidad"
                      className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-3 text-2xl font-bold text-on-surface focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all outline-none text-center placeholder:text-outline-variant/50" 
                      placeholder="0" 
                      step="1" 
                      type="number"
                      value={formData.cantidad}
                      onChange={e => setFormData({ ...formData, cantidad: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-medium">Use números negativos para salidas</p>
              </div>
            </div>

            {/* Financial Preview */}
            <div className="w-full md:w-1/2 bg-surface-container rounded-lg p-5 border-l-4 border-secondary space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-on-surface-variant font-medium">Costo Promedio (Unidad)</span>
                <span className="text-sm font-bold text-on-surface">{formatSoles(costoPromedio)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-outline-variant/20">
                <span className="text-xs text-on-surface-variant font-medium">Valor Total Ajuste</span>
                <span className="text-lg font-extrabold text-secondary">{formatSoles(parseFloat(valorTotal))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Motivo */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-on-surface-variant">
            Motivo / Referencia
          </label>
          <textarea 
            name="motivo"
            className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none placeholder:text-on-surface-variant/50 resize-none" 
            placeholder="Ej: Reposición de stock..." 
            rows={3}
            value={formData.motivo}
            onChange={e => setFormData({ ...formData, motivo: e.target.value })}
          ></textarea>
          
          {/* Quick Suggestions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={() => handleSuggestionClick('Compra de Mercancía')} className="px-3 py-1.5 bg-surface-container hover:bg-surface-variant/50 rounded-full text-xs font-medium text-on-surface-variant hover:text-primary transition-all" type="button">Compra de Mercancía</button>
            <button onClick={() => handleSuggestionClick('Corrección de Saldo')} className="px-3 py-1.5 bg-surface-container hover:bg-surface-variant/50 rounded-full text-xs font-medium text-on-surface-variant hover:text-primary transition-all" type="button">Corrección de Saldo</button>
            <button onClick={() => handleSuggestionClick('Daño / Mermas')} className="px-3 py-1.5 bg-surface-container hover:bg-surface-variant/50 rounded-full text-xs font-medium text-on-surface-variant hover:text-error transition-all" type="button">Daño / Mermas</button>
          </div>
        </div>

        {/* Form Actions (Matching Ventas/Productos Modal) */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 border border-outline-variant/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[140px] flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg bg-gradient-to-br from-primary-dim to-primary text-on-primary-container hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            {isSubmitting ? (
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            )}
            {isSubmitting ? 'Guardando...' : 'Confirmar Entrada'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

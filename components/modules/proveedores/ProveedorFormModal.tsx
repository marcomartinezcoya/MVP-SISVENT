'use client';

import React, { useState, useEffect } from 'react';
import {
  Proveedor,
  ProveedorCreateInput,
  ProveedorUpdateInput,
  CATEGORIAS_PROVEEDOR,
  EstadoProveedor,
  CategoriaProveedor,
} from '@/lib/types/proveedor';

interface ProveedorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  proveedor: Proveedor | null;
  onSave: (
    data: ProveedorCreateInput | ProveedorUpdateInput,
    mode: 'create' | 'edit',
  ) => Promise<{ success: boolean; error?: string }>;
}

const EMPTY_FORM: ProveedorCreateInput = {
  nombre: '',
  ruc: '',
  contacto: '',
  categoria: 'Tecnología',
  telefono: '',
  email: '',
  direccion: '',
  estado: 'activo',
};

export function ProveedorFormModal({
  isOpen,
  onClose,
  proveedor,
  onSave,
}: ProveedorFormModalProps) {
  const [form, setForm] = useState<ProveedorCreateInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProveedorCreateInput, string>>>({});

  const isEditing = proveedor !== null;

  // Sync form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (proveedor) {
        setForm({
          nombre: proveedor.nombre,
          ruc: proveedor.ruc,
          contacto: proveedor.contacto,
          categoria: proveedor.categoria,
          telefono: proveedor.telefono,
          email: proveedor.email,
          direccion: proveedor.direccion ?? '',
          estado: proveedor.estado,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
    }
  }, [isOpen, proveedor]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!form.ruc.trim()) newErrors.ruc = 'El RUC es requerido';
    else if (!/^\d{11}$/.test(form.ruc.trim())) newErrors.ruc = 'El RUC debe tener 11 dígitos';
    if (!form.contacto.trim()) newErrors.contacto = 'La persona de contacto es requerida';
    if (!form.telefono.trim()) newErrors.telefono = 'El teléfono es requerido';
    if (!form.email.trim()) newErrors.email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Email inválido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const result = await onSave(form, isEditing ? 'edit' : 'create');
    setSaving(false);
    if (result.success) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'Editar proveedor' : 'Añadir proveedor'}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-surface-container-low rounded-2xl shadow-2xl shadow-black/60 border border-outline-variant/20 animate-in fade-in slide-in-from-bottom-4 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_shipping
              </span>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-on-surface tracking-tight">
                {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {isEditing
                  ? 'Actualiza los datos del proveedor'
                  : 'Completa el formulario para registrar'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Nombre del Proveedor <span className="text-error">*</span>
              </label>
              <input
                id="proveedor-nombre"
                name="nombre"
                type="text"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej: TechLogistics Global"
                className={`w-full bg-surface-container border rounded-lg px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all ${
                  errors.nombre ? 'border-error/60 focus:ring-error/40' : 'border-outline-variant/20'
                }`}
              />
              {errors.nombre && (
                <p className="mt-1 text-xs text-error flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {errors.nombre}
                </p>
              )}
            </div>

            {/* RUC */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                RUC <span className="text-error">*</span>
              </label>
              <input
                id="proveedor-ruc"
                name="ruc"
                type="text"
                value={form.ruc}
                onChange={handleChange}
                placeholder="20123456789"
                maxLength={11}
                className={`w-full bg-surface-container border rounded-lg px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all ${
                  errors.ruc ? 'border-error/60 focus:ring-error/40' : 'border-outline-variant/20'
                }`}
              />
              {errors.ruc && (
                <p className="mt-1 text-xs text-error flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {errors.ruc}
                </p>
              )}
            </div>

            {/* Persona de Contacto */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Persona de Contacto <span className="text-error">*</span>
              </label>
              <input
                id="proveedor-contacto"
                name="contacto"
                type="text"
                value={form.contacto}
                onChange={handleChange}
                placeholder="Nombre completo"
                className={`w-full bg-surface-container border rounded-lg px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all ${
                  errors.contacto ? 'border-error/60 focus:ring-error/40' : 'border-outline-variant/20'
                }`}
              />
              {errors.contacto && (
                <p className="mt-1 text-xs text-error flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {errors.contacto}
                </p>
              )}
            </div>

            {/* Teléfono + Email (2 cols) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Teléfono <span className="text-error">*</span>
                </label>
                <input
                  id="proveedor-telefono"
                  name="telefono"
                  type="tel"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="+51 999 000 000"
                  className={`w-full bg-surface-container border rounded-lg px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all ${
                    errors.telefono ? 'border-error/60 focus:ring-error/40' : 'border-outline-variant/20'
                  }`}
                />
                {errors.telefono && (
                  <p className="mt-1 text-xs text-error">{errors.telefono}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Email <span className="text-error">*</span>
                </label>
                <input
                  id="proveedor-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="contacto@empresa.com"
                  className={`w-full bg-surface-container border rounded-lg px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all ${
                    errors.email ? 'border-error/60 focus:ring-error/40' : 'border-outline-variant/20'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-error">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Categoría + Estado (2 cols) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Categoría <span className="text-error">*</span>
                </label>
                <select
                  id="proveedor-categoria"
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                >
                  {CATEGORIAS_PROVEEDOR.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Estado
                </label>
                <select
                  id="proveedor-estado"
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            {/* Dirección (opcional) */}
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Dirección <span className="text-on-surface-variant/50 font-normal normal-case">(opcional)</span>
              </label>
              <textarea
                id="proveedor-direccion"
                name="direccion"
                value={form.direccion ?? ''}
                onChange={handleChange}
                placeholder="Av. Ejemplo 123, Distrito, Ciudad"
                rows={2}
                className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-outline-variant/10 flex justify-end gap-3 bg-surface-container-low/50">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              id="proveedor-submit-btn"
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary-dim to-primary text-on-primary-container font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
            >
              <span className="material-symbols-outlined text-xl">
                {saving ? 'hourglass_top' : isEditing ? 'save' : 'add'}
              </span>
              {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Registrar Proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

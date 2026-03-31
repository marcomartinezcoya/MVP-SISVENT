'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Cliente, ClienteCreateInput, ClienteUpdateInput, ClienteCategoria } from '@/lib/types/cliente';

interface ClienteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente?: Cliente | null;
  onSave: (
    data: ClienteCreateInput | ClienteUpdateInput,
    mode: 'create' | 'edit',
  ) => Promise<{ success: boolean; error?: string }>;
}

const EMPTY_FORM: Omit<ClienteCreateInput, 'avatar_url'> = {
  nombre: '',
  empresa: '',
  email: '',
  telefono: '',
  categoria: 'Regular',
  notas: '',
};

export const ClienteFormModal: React.FC<ClienteFormModalProps> = ({
  isOpen,
  onClose,
  cliente,
  onSave,
}) => {
  const isEditMode = !!cliente;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof EMPTY_FORM, string>>>({});

  const clearLocalPreview = useCallback(() => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview('');
    }
  }, [localPreview]);

  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre,
        empresa: cliente.empresa,
        email: cliente.email,
        telefono: cliente.telefono,
        categoria: cliente.categoria,
        notas: cliente.notas ?? '',
      });
      setImageUrl(cliente.avatar_url ?? '');
    } else {
      setFormData(EMPTY_FORM);
      setImageUrl('');
    }
    setPendingFile(null);
    clearLocalPreview();
    setFormError(null);
    setErrors({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('El archivo seleccionado no es una imagen válida.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError('La imagen no debe superar los 5 MB.');
      return;
    }

    setFormError(null);
    clearLocalPreview();
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setPendingFile(file);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof EMPTY_FORM]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setFormError(null);
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'Obligatorio';
    if (!formData.empresa.trim()) newErrors.empresa = 'Obligatorio';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!formData.telefono.trim()) newErrors.telefono = 'Obligatorio';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      let finalImageUrl = imageUrl;
      if (pendingFile) {
        // En producción aquí iría la carga a Supabase.
        // Simulamos usando el localPreview temporalmente para UI Mockup.
        finalImageUrl = localPreview;
      }

      const payload = {
        ...formData,
        avatar_url: finalImageUrl || null,
      };

      const result = await onSave(payload, isEditMode ? 'edit' : 'create');
      if (result.success) {
        onClose();
      } else {
        setFormError(result.error ?? 'Error desconocido al guardar');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClass = (fieldName: keyof typeof EMPTY_FORM) =>
    `w-full bg-surface-container border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none placeholder:text-on-surface-variant/50 ${
      errors[fieldName] ? 'border-error/60 focus:ring-error/40' : 'border-outline-variant/20'
    }`;

  const displayImage = localPreview || imageUrl || null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Cliente' : 'Añadir Cliente'}
      maxWidth="max-w-2xl"
      icon="person_add"
      iconBgClass="bg-primary/10 shadow-[0_0_20px_rgba(125,156,255,0.2)]"
      iconTextClass="text-primary"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="flex items-center gap-2 px-4 py-3 bg-error/10 border border-error/30 rounded-lg text-sm text-error">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* ── Foto de Perfil ──────────────────────────────────────────── */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-on-surface-variant block mb-2">
              Foto de Perfil <span className="text-on-surface-variant/50 font-normal text-xs normal-case">(opcional)</span>
            </label>
            <div className="flex items-start gap-4">
              <div className="shrink-0 h-24 w-24 rounded-xl bg-surface-container-highest border border-outline-variant/20 overflow-hidden flex items-center justify-center">
                {displayImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displayImage}
                    alt="Vista previa"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">
                    image
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-surface-container-highest text-on-surface hover:bg-surface-variant/50 border border-outline-variant/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-base">upload</span>
                  {pendingFile ? 'Cambiar foto' : isEditMode && imageUrl ? 'Reemplazar foto' : 'Subir foto'}
                </button>

                {pendingFile && (
                  <p className="text-xs text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                    {pendingFile.name}
                    <span className="text-on-surface-variant/50">
                      ({(pendingFile.size / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingFile(null);
                        clearLocalPreview();
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="ml-1 text-error hover:text-error/80 transition-colors"
                      title="Quitar foto seleccionada"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </p>
                )}

                <p className="text-[11px] text-on-surface-variant/50">
                  PNG, JPG o WEBP · Máx 5 MB · Solo se guarda localmente por ahora.
                </p>
              </div>
            </div>
          </div>

          {/* ── Nombre ───────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              Nombre o Contacto <span className="text-error">*</span>
            </label>
            <input
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={getInputClass('nombre')}
              placeholder="Ej: Sarah Jenkins"
              disabled={isSubmitting}
            />
            {errors.nombre && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.nombre}
              </p>
            )}
          </div>

          {/* ── Empresa ──────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              Empresa / Razón Social <span className="text-error">*</span>
            </label>
            <input
              name="empresa"
              value={formData.empresa}
              onChange={handleChange}
              className={getInputClass('empresa')}
              placeholder="Ej: Global Logistics Inc."
              disabled={isSubmitting}
            />
            {errors.empresa && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.empresa}
              </p>
            )}
          </div>

          {/* ── Email ────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              Email <span className="text-error">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={getInputClass('email')}
              placeholder="contacto@empresa.com"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.email}
              </p>
            )}
          </div>

          {/* ── Teléfono ─────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              Teléfono <span className="text-error">*</span>
            </label>
            <input
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className={getInputClass('telefono')}
              placeholder="+1 234 567 890"
              disabled={isSubmitting}
            />
            {errors.telefono && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.telefono}
              </p>
            )}
          </div>

          {/* ── Categoría ────────────────────────────────────────── */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-on-surface-variant">
              Categoría
            </label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className={`${getInputClass('categoria')} appearance-none cursor-pointer`}
              disabled={isSubmitting}
            >
              <option value="Regular">Regular</option>
              <option value="VIP">VIP</option>
              <option value="Nuevo">Nuevo</option>
            </select>
          </div>

          {/* ── Notas ────────────────────────────────────────────── */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-on-surface-variant">
              Notas adicionales
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows={2}
              className={getInputClass('notas')}
              placeholder="Información adicional del cliente..."
              disabled={isSubmitting}
            />
          </div>
        </div>

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
            className="min-w-[140px] flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg bg-gradient-to-br from-primary-dim to-primary text-on-primary-container hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex-none"
          >
            {isSubmitting && (
              <span className="material-symbols-outlined text-base animate-spin">
                progress_activity
              </span>
            )}
            {isSubmitting ? 'Guardando…' : isEditMode ? 'Guardar Cambios' : 'Añadir Cliente'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

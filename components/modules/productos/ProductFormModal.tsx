'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Producto, ProductoCreateInput, ProductoUpdateInput } from '@/lib/types/producto';
import { supabaseBrowser } from '@/lib/supabase/client';

// ── Tipos ─────────────────────────────────────────────────────────

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Producto | null;
  onSave: (
    data: ProductoCreateInput | ProductoUpdateInput,
    mode: 'create' | 'edit',
  ) => Promise<{ success: boolean; error?: string }>;
}

// ── Estado vacío del formulario ───────────────────────────────────

const EMPTY_FORM = {
  nombre: '',
  categoria: 'Electrónica',
  precio_compra: '',
  precio_venta: '',
  stock_actual: '',
  stock_minimo: '10',
  estado: 'Activo',
};

// ── Helpers ───────────────────────────────────────────────────────

function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg';
}

// ── Componente ────────────────────────────────────────────────────

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  product,
  onSave,
}) => {
  const isEditMode = !!product;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof EMPTY_FORM, string>>>({});

  const clearLocalPreview = useCallback(() => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview('');
    }
  }, [localPreview]);

  useEffect(() => {
    if (product) {
      setFormData({
        nombre: product.nombre ?? '',
        categoria: product.categoria ?? 'Electrónica',
        precio_compra: product.precio_compra?.toString() ?? '0',
        precio_venta: product.precio_venta?.toString() ?? '0',
        stock_actual: product.stock_actual?.toString() ?? '0',
        stock_minimo: product.stock_minimo?.toString() ?? '10',
        estado: product.estado ? 'Activo' : 'Inactivo',
      });
      setImageUrl(product.imagen_url ?? '');
    } else {
      setFormData(EMPTY_FORM);
      setImageUrl('');
    }
    setPendingFile(null);
    clearLocalPreview();
    setFormError(null);
    setErrors({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof EMPTY_FORM]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setFormError(null);
  };

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

  const uploadPendingFile = async (): Promise<string | null> => {
    if (!pendingFile) return null;
    setIsUploadingImage(true);
    try {
      const ext = getExtension(pendingFile.name);
      const filename = `${crypto.randomUUID()}.${ext}`;

      const { error } = await supabaseBrowser.storage
        .from('productos')
        .upload(filename, pendingFile, {
          contentType: pendingFile.type,
          upsert: false,
        });

      if (error) {
        setFormError(`Error al subir imagen: ${error.message}`);
        return null;
      }

      const { data: urlData } = supabaseBrowser.storage
        .from('productos')
        .getPublicUrl(filename);

      return urlData.publicUrl;
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error desconocido al subir');
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!formData.categoria.trim()) newErrors.categoria = 'La categoría es obligatoria';
    if (formData.precio_compra === '' || isNaN(parseFloat(formData.precio_compra))) newErrors.precio_compra = 'Requerido';
    if (formData.precio_venta === '' || isNaN(parseFloat(formData.precio_venta))) newErrors.precio_venta = 'Requerido';
    if (formData.stock_actual === '' || isNaN(parseInt(formData.stock_actual, 10))) newErrors.stock_actual = 'Requerido';
    if (formData.stock_minimo === '' || isNaN(parseInt(formData.stock_minimo, 10))) newErrors.stock_minimo = 'Requerido';
    
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
        const uploaded = await uploadPendingFile();
        if (uploaded === null) {
          return;
        }
        finalImageUrl = uploaded;
      }

      const estadoBool = formData.estado === 'Activo';

      let payload: ProductoCreateInput | ProductoUpdateInput;
      if (isEditMode && product) {
        payload = {
          nombre: formData.nombre,
          sku: product.sku,
          categoria: formData.categoria,
          precio_compra: parseFloat(formData.precio_compra) || 0,
          precio_venta: parseFloat(formData.precio_venta) || 0,
          stock_actual: parseInt(formData.stock_actual, 10) || 0,
          stock_minimo: parseInt(formData.stock_minimo, 10) || 0,
          imagen_url: finalImageUrl || null,
          estado: estadoBool,
        };
      } else {
        payload = {
          nombre: formData.nombre,
          categoria: formData.categoria,
          precio_compra: parseFloat(formData.precio_compra) || 0,
          precio_venta: parseFloat(formData.precio_venta) || 0,
          stock_actual: parseInt(formData.stock_actual, 10) || 0,
          stock_minimo: parseInt(formData.stock_minimo, 10) || 0,
          imagen_url: finalImageUrl || null,
          estado: estadoBool,
        };
      }

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

  const displayImage = localPreview || imageUrl || null;
  const isBusy = isSubmitting || isUploadingImage;

  const getInputClass = (fieldName: keyof typeof EMPTY_FORM) =>
    `w-full bg-surface-container border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none placeholder:text-on-surface-variant/50 ${
      errors[fieldName] ? 'border-error/60 focus:ring-error/40' : 'border-outline-variant/20'
    }`;

  const readonlyClass =
    'w-full bg-surface-container-highest border border-outline-variant/10 rounded-lg px-4 py-2.5 text-sm text-on-surface-variant/70 cursor-not-allowed select-none';

  const submitLabel = isUploadingImage
    ? 'Subiendo imagen…'
    : isSubmitting
    ? 'Guardando…'
    : isEditMode
    ? 'Guardar Cambios'
    : 'Crear Producto';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Producto' : 'Nuevo Producto'}
      maxWidth="max-w-2xl"
      icon="inventory_2"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Server-level error banner */}
        {formError && (
          <div className="flex items-center gap-2 px-4 py-3 bg-error/10 border border-error/30 rounded-lg text-sm text-error">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* ── Imagen ──────────────────────────────────────────── */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-on-surface-variant block mb-2">
              Imagen del Producto <span className="text-on-surface-variant/50 font-normal text-xs normal-case">(opcional)</span>
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
                  disabled={isBusy}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-surface-container-highest text-on-surface hover:bg-surface-variant/50 border border-outline-variant/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-base">upload</span>
                  {pendingFile ? 'Cambiar imagen' : isEditMode && imageUrl ? 'Reemplazar imagen' : 'Subir imagen'}
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
                      title="Quitar imagen seleccionada"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </p>
                )}

                <p className="text-[11px] text-on-surface-variant/50">
                  PNG, JPG, WEBP · Máx 5 MB · Solo se guarda la URL.
                </p>
              </div>
            </div>
          </div>

          {/* ── Nombre ───────────────────────────────────────────── */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-on-surface-variant">
              Nombre del Producto <span className="text-error">*</span>
            </label>
            <input
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={getInputClass('nombre')}
              placeholder="Ej: Laptop XPS 15"
              disabled={isBusy}
            />
            {errors.nombre && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.nombre}
              </p>
            )}
          </div>

          {/* ── Código (solo edición, readonly) ───────────────────── */}
          {isEditMode && product && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-on-surface-variant flex items-center gap-1.5">
                Código Producto
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/50 bg-surface-container-highest px-1.5 py-0.5 rounded">
                  Auto
                </span>
              </label>
              <input
                readOnly
                tabIndex={-1}
                value={product.sku}
                className={readonlyClass}
              />
            </div>
          )}

          {/* ── Categoría ─────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              Categoría <span className="text-error">*</span>
            </label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className={`${getInputClass('categoria')} appearance-none cursor-pointer`}
              disabled={isBusy}
            >
              <option value="Electrónica">Electrónica</option>
              <option value="Accesorios">Accesorios</option>
              <option value="Mobiliario">Mobiliario</option>
              <option value="Hardware">Hardware</option>
              <option value="Suministros">Suministros</option>
              <option value="Oficina">Oficina</option>
              <option value="Redes">Redes</option>
            </select>
            {errors.categoria && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.categoria}
              </p>
            )}
          </div>

          {/* ── Precio Venta ──────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              Precio Venta (S/) <span className="text-error">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="precio_venta"
              value={formData.precio_venta}
              onChange={handleChange}
              className={getInputClass('precio_venta')}
              placeholder="0.00"
              disabled={isBusy}
            />
            {errors.precio_venta && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.precio_venta}
              </p>
            )}
          </div>

          {/* ── Precio Compra ─────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              Precio Compra (S/) <span className="text-error">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="precio_compra"
              value={formData.precio_compra}
              onChange={handleChange}
              className={getInputClass('precio_compra')}
              placeholder="0.00"
              disabled={isBusy}
            />
            {errors.precio_compra && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.precio_compra}
              </p>
            )}
          </div>

          {/* ── Stock Actual ──────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              Stock Actual <span className="text-error">*</span>
            </label>
            <input
              type="number"
              min="0"
              name="stock_actual"
              value={formData.stock_actual}
              onChange={handleChange}
              className={getInputClass('stock_actual')}
              placeholder="0"
              disabled={isBusy}
            />
            {errors.stock_actual && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.stock_actual}
              </p>
            )}
          </div>

          {/* ── Stock Mínimo ──────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              Stock Mínimo <span className="text-error">*</span>
            </label>
            <input
              type="number"
              min="0"
              name="stock_minimo"
              value={formData.stock_minimo}
              onChange={handleChange}
              className={getInputClass('stock_minimo')}
              placeholder="10"
              disabled={isBusy}
            />
             {errors.stock_minimo && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.stock_minimo}
              </p>
            )}
          </div>

          {/* ── Estado ───────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              Estado
            </label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className={`${getInputClass('estado')} appearance-none cursor-pointer`}
              disabled={isBusy}
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        {/* ── Acciones ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 border border-outline-variant/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isBusy}
            className="min-w-[140px] flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg bg-gradient-to-br from-primary-dim to-primary text-on-primary-container hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            {isBusy && (
              <span className="material-symbols-outlined text-base animate-spin">
                progress_activity
              </span>
            )}
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
};

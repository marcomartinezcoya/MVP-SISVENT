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
  // URL de imagen: puede venir de la DB (edición) o del Storage tras subida
  const [imageUrl, setImageUrl] = useState<string>('');
  // Archivo pendiente de subir (null = no cambió)
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  // Preview local inmediata (object URL)
  const [localPreview, setLocalPreview] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  // ── Limpieza de object URLs para evitar memory leaks ─────────────
  const clearLocalPreview = useCallback(() => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview('');
    }
  }, [localPreview]);

  // ── Poblar el formulario cuando cambia el producto o se abre ─────
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
    // Limpiar archivo pendiente y preview al abrir/cerrar
    setPendingFile(null);
    clearLocalPreview();
    setUploadError('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, isOpen]);

  // ── Manejo de cambios simples ─────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ── Selección de archivo ──────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setUploadError('El archivo seleccionado no es una imagen válida.');
      return;
    }
    // Validar tamaño (máx 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('La imagen no debe superar los 5 MB.');
      return;
    }

    setUploadError('');
    clearLocalPreview();
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setPendingFile(file);
  };

  // ── Upload directo browser → Supabase Storage ─────────────────────
  // NO pasa por Server Action (evita límite 1MB de Next.js).
  // Solo la URL pública resultante (string) se envía al servidor.
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
        setUploadError(`Error al subir imagen: ${error.message}`);
        return null;
      }

      const { data: urlData } = supabaseBrowser.storage
        .from('productos')
        .getPublicUrl(filename);

      return urlData.publicUrl;
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error desconocido al subir');
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };


  // ── Envío del formulario ─────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadError('');

    try {
      // Subir imagen primero si hay una pendiente
      let finalImageUrl = imageUrl;
      if (pendingFile) {
        const uploaded = await uploadPendingFile();
        if (uploaded === null) {
          // uploadPendingFile ya seteó el error
          return;
        }
        finalImageUrl = uploaded;
      }

      const estadoBool = formData.estado === 'Activo';

      if (isEditMode && product) {
        const payload: ProductoUpdateInput = {
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
        await onSave(payload, 'edit');
      } else {
        const payload: ProductoCreateInput = {
          nombre: formData.nombre,
          categoria: formData.categoria,
          precio_compra: parseFloat(formData.precio_compra) || 0,
          precio_venta: parseFloat(formData.precio_venta) || 0,
          stock_actual: parseInt(formData.stock_actual, 10) || 0,
          stock_minimo: parseInt(formData.stock_minimo, 10) || 0,
          imagen_url: finalImageUrl || null,
          estado: estadoBool,
        };
        await onSave(payload, 'create');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Preview a mostrar: local (recién elegida) o remota (existente) ─
  const displayImage = localPreview || imageUrl || null;

  const isBusy = isSubmitting || isUploadingImage;

  const inputClass =
    'w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none placeholder:text-on-surface-variant/50';

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
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ── Imagen ──────────────────────────────────────────── */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-on-surface-variant block mb-2">
              Imagen del Producto
            </label>
            <div className="flex items-start gap-4">
              {/* Preview */}
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

              {/* Controles */}
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

                {uploadError && (
                  <p className="text-xs text-error flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {uploadError}
                  </p>
                )}

                <p className="text-[11px] text-on-surface-variant/50">
                  PNG, JPG, WEBP · Máx 5 MB · Solo se guarda la URL, nunca el archivo en la base de datos.
                </p>
              </div>
            </div>
          </div>

          {/* ── Nombre ───────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              Nombre del Producto
            </label>
            <input
              required
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={inputClass}
              placeholder="Ej: Laptop XPS 15"
              disabled={isBusy}
            />
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
              Categoría
            </label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className={inputClass}
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
          </div>

          {/* ── Precio Venta ──────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              Precio Venta (S/)
            </label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              name="precio_venta"
              value={formData.precio_venta}
              onChange={handleChange}
              className={inputClass}
              placeholder="0.00"
              disabled={isBusy}
            />
          </div>

          {/* ── Precio Compra ─────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              Precio Compra (S/)
            </label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              name="precio_compra"
              value={formData.precio_compra}
              onChange={handleChange}
              className={inputClass}
              placeholder="0.00"
              disabled={isBusy}
            />
          </div>

          {/* ── Stock Actual ──────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              Stock Actual
            </label>
            <input
              required
              type="number"
              min="0"
              name="stock_actual"
              value={formData.stock_actual}
              onChange={handleChange}
              className={inputClass}
              placeholder="0"
              disabled={isBusy}
            />
          </div>

          {/* ── Stock Mínimo ──────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              Stock Mínimo
            </label>
            <input
              required
              type="number"
              min="0"
              name="stock_minimo"
              value={formData.stock_minimo}
              onChange={handleChange}
              className={inputClass}
              placeholder="10"
              disabled={isBusy}
            />
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
              className={inputClass}
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

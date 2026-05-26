'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { supabaseBrowser } from '@/lib/supabase/client';
import {
  ClienteDB,
  ClienteCreateInput,
  ClienteUpdateInput,
  TipoCliente,
} from '@/lib/types/cliente';

// ──────────────────────────────────────────────────────────────────
//  Props
// ──────────────────────────────────────────────────────────────────

interface ClienteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente?: ClienteDB | null;
  onSave: (
    data: ClienteCreateInput | ClienteUpdateInput,
    mode: 'create' | 'edit',
  ) => Promise<{ success: boolean; error?: string }>;
}

// ──────────────────────────────────────────────────────────────────
//  Form state
// ──────────────────────────────────────────────────────────────────

interface FormState {
  tipo_cliente: TipoCliente;
  nombres: string;
  apellidos: string;
  razon_social: string;
  documento: string;
  telefono: string;
  email: string;
  direccion: string;
  estado: boolean;
}

const EMPTY_FORM: FormState = {
  tipo_cliente: 'persona',
  nombres: '',
  apellidos: '',
  razon_social: '',
  documento: '',
  telefono: '',
  email: '',
  direccion: '',
  estado: true,
};

// ──────────────────────────────────────────────────────────────────
//  Helper: upload a file to Supabase Storage bucket 'clientes'
// ──────────────────────────────────────────────────────────────────

async function uploadClientePhoto(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `avatars/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabaseBrowser.storage
    .from('clientes')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) return null;

  const { data } = supabaseBrowser.storage.from('clientes').getPublicUrl(path);
  return data.publicUrl;
}

// ══════════════════════════════════════════════════════════════════
//  Component
// ══════════════════════════════════════════════════════════════════

export const ClienteFormModal: React.FC<ClienteFormModalProps> = ({
  isOpen,
  onClose,
  cliente,
  onSave,
}) => {
  const isEditMode = !!cliente;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string>('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // ── Cleanup object URL ───────────────────────────────────────────
  const clearLocalPreview = useCallback(() => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview('');
    }
  }, [localPreview]);

  // ── Populate form on open ────────────────────────────────────────
  useEffect(() => {
    if (cliente) {
      setFormData({
        tipo_cliente:  cliente.tipo_cliente,
        nombres:       cliente.nombres ?? '',
        apellidos:     cliente.apellidos ?? '',
        razon_social:  cliente.razon_social ?? '',
        documento:     cliente.documento,
        telefono:      cliente.telefono,
        email:         cliente.email ?? '',
        direccion:     cliente.direccion ?? '',
        estado:        cliente.estado,
      });
      setExistingPhotoUrl(cliente.foto_url ?? '');
    } else {
      setFormData(EMPTY_FORM);
      setExistingPhotoUrl('');
    }
    setPendingFile(null);
    clearLocalPreview();
    setFormError(null);
    setErrors({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente, isOpen]);

  // ── File picker ──────────────────────────────────────────────────
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
    setLocalPreview(URL.createObjectURL(file));
    setPendingFile(file);
  };

  // ── Generic change handler ───────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setFormData(prev => ({ ...prev, [name]: checked !== undefined ? checked : value }));
    if (errors[name as keyof FormState]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setFormError(null);
  };

  // ── Validation ───────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!formData.tipo_cliente) newErrors.tipo_cliente = 'Obligatorio';
    if (formData.tipo_cliente === 'empresa' && !formData.razon_social.trim()) {
      newErrors.razon_social = 'Obligatorio para empresas';
    }
    if (formData.tipo_cliente === 'persona' && !formData.nombres.trim()) {
      newErrors.nombres = 'Obligatorio para personas';
    }
    // Documento
    if (!formData.documento.trim()) {
      newErrors.documento = 'Obligatorio';
    } else if (formData.tipo_cliente === 'persona') {
      if (!/^\d{8}$/.test(formData.documento.trim()))
        newErrors.documento = 'El DNI debe tener exactamente 8 dígitos';
    } else if (formData.tipo_cliente === 'empresa') {
      if (!/^\d{11}$/.test(formData.documento.trim()))
        newErrors.documento = 'El RUC debe tener exactamente 11 dígitos';
    }
    // Teléfono
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'Obligatorio';
    } else if (!/^\d{9}$/.test(formData.telefono.trim())) {
      newErrors.telefono = 'El celular debe tener exactamente 9 dígitos';
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      // Upload photo to Supabase Storage if new file selected
      let finalPhotoUrl: string | null = existingPhotoUrl || null;
      if (pendingFile) {
        const uploaded = await uploadClientePhoto(pendingFile);
        if (uploaded) {
          finalPhotoUrl = uploaded;
        } else {
          setFormError('Error al subir la foto. Verifica tu conexión.');
          return;
        }
      }

      let result: { success: boolean; error?: string };

      if (isEditMode && cliente) {
        const updatePayload: ClienteUpdateInput = {
          nombres:      formData.nombres || null,
          apellidos:    formData.apellidos || null,
          razon_social: formData.razon_social || null,
          telefono:     formData.telefono,
          email:        formData.email || null,
          direccion:    formData.direccion || null,
          foto_url:     finalPhotoUrl,
          estado:       formData.estado,
        };
        result = await onSave(updatePayload, 'edit');
      } else {
        const createPayload: ClienteCreateInput = {
          tipo_cliente: formData.tipo_cliente,
          nombres:      formData.nombres || null,
          apellidos:    formData.apellidos || null,
          razon_social: formData.razon_social || null,
          documento:    formData.documento,
          telefono:     formData.telefono,
          email:        formData.email || null,
          direccion:    formData.direccion || null,
          foto_url:     finalPhotoUrl,
          estado:       formData.estado,
        };
        result = await onSave(createPayload, 'create');
      }

      if (result.success) {
        onClose();
      } else {
        setFormError(result.error ?? 'Error desconocido al guardar');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────
  const getInputClass = (fieldName: keyof FormState) =>
    `w-full bg-surface-container border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary text-on-surface transition-all outline-none placeholder:text-on-surface-variant/50 ${
      errors[fieldName] ? 'border-error/60 focus:ring-error/40' : 'border-outline-variant/20'
    }`;

  const displayImage = localPreview || existingPhotoUrl || null;
  const isEmpresa = formData.tipo_cliente === 'empresa';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Cliente' : 'Nuevo Cliente'}
      maxWidth="max-w-2xl"
      icon="person_add"
      iconBgClass="bg-primary/10 shadow-[0_0_20px_rgba(125,156,255,0.2)]"
      iconTextClass="text-primary"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Error global ─────────────────────────────────────────── */}
        {formError && (
          <div className="flex items-center gap-2 px-4 py-3 bg-error/10 border border-error/30 rounded-lg text-sm text-error">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ── Foto de Perfil ─────────────────────────────────────── */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-on-surface-variant block mb-2">
              Foto de Perfil{' '}
              <span className="text-on-surface-variant/50 font-normal text-xs">(opcional)</span>
            </label>
            <div className="flex items-start gap-4">
              <div className="shrink-0 h-24 w-24 rounded-xl bg-surface-container-highest border border-outline-variant/20 overflow-hidden flex items-center justify-center">
                {displayImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={displayImage} alt="Vista previa" className="h-full w-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">image</span>
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
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-surface-container-highest text-on-surface hover:bg-surface-variant/50 border border-outline-variant/20 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">upload</span>
                  {pendingFile ? 'Cambiar foto' : existingPhotoUrl ? 'Reemplazar foto' : 'Subir foto'}
                </button>
                {pendingFile && (
                  <p className="text-xs text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                    {pendingFile.name}
                    <span className="text-on-surface-variant/50">({(pendingFile.size / 1024).toFixed(0)} KB)</span>
                    <button
                      type="button"
                      onClick={() => { setPendingFile(null); clearLocalPreview(); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="ml-1 text-error hover:text-error/80 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </p>
                )}
                <p className="text-[11px] text-on-surface-variant/50">PNG, JPG o WEBP · Máx 5 MB · Se guarda en Supabase Storage.</p>
              </div>
            </div>
          </div>

          {/* ── Tipo de Cliente ────────────────────────────────────── */}
          {!isEditMode && (
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-on-surface-variant">
                Tipo de Cliente <span className="text-error">*</span>
              </label>
              <select
                name="tipo_cliente"
                value={formData.tipo_cliente}
                onChange={handleChange}
                className={`${getInputClass('tipo_cliente')} appearance-none cursor-pointer`}
                disabled={isSubmitting}
              >
                <option value="persona">Persona Natural</option>
                <option value="empresa">Empresa / RUC</option>
              </select>
              {errors.tipo_cliente && (
                <p className="mt-1 text-xs text-error flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {errors.tipo_cliente}
                </p>
              )}
            </div>
          )}

          {/* ── Campos Persona ─────────────────────────────────────── */}
          {!isEmpresa && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-on-surface-variant">
                  Nombres <span className="text-error">*</span>
                </label>
                <input
                  name="nombres"
                  value={formData.nombres}
                  onChange={handleChange}
                  className={getInputClass('nombres')}
                  placeholder="Ej: Juan Carlos"
                  disabled={isSubmitting}
                />
                {errors.nombres && (
                  <p className="mt-1 text-xs text-error flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>{errors.nombres}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-on-surface-variant">Apellidos</label>
                <input
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  className={getInputClass('apellidos')}
                  placeholder="Ej: Pérez Gómez"
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}

          {/* ── Campo Empresa ──────────────────────────────────────── */}
          {isEmpresa && (
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-on-surface-variant">
                Razón Social <span className="text-error">*</span>
              </label>
              <input
                name="razon_social"
                value={formData.razon_social}
                onChange={handleChange}
                className={getInputClass('razon_social')}
                placeholder="Ej: Global Logistics SAC"
                disabled={isSubmitting}
              />
              {errors.razon_social && (
                <p className="mt-1 text-xs text-error flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>{errors.razon_social}
                </p>
              )}
            </div>
          )}

          {/* ── Documento ─────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              {isEmpresa ? 'RUC' : 'DNI'} <span className="text-error">*</span>
            </label>
            <input
              name="documento"
              value={formData.documento}
              onChange={handleChange}
              inputMode="numeric"
              maxLength={isEmpresa ? 11 : 8}
              className={getInputClass('documento')}
              placeholder={isEmpresa ? '20100012345' : '12345678'}
              disabled={isSubmitting || isEditMode}
            />
            {isEditMode && (
              <p className="text-[11px] text-on-surface-variant/50">El documento no puede modificarse.</p>
            )}
            {errors.documento && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>{errors.documento}
              </p>
            )}
          </div>

          {/* ── Teléfono ──────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">
              Celular <span className="text-error">*</span>
            </label>
            <input
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              type="tel"
              inputMode="numeric"
              maxLength={9}
              className={getInputClass('telefono')}
              placeholder="987654321"
              disabled={isSubmitting}
            />
            {errors.telefono && (
              <p className="mt-1 text-xs text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>{errors.telefono}
              </p>
            )}
          </div>

          {/* ── Email ─────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">Email</label>
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
                <span className="material-symbols-outlined text-sm">error</span>{errors.email}
              </p>
            )}
          </div>

          {/* ── Dirección ─────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-on-surface-variant">Dirección</label>
            <input
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              className={getInputClass('direccion')}
              placeholder="Av. Los Alamos 123, Lima"
              disabled={isSubmitting}
            />
          </div>

          {/* ── Estado ────────────────────────────────────────────── */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-on-surface-variant">Estado</label>
            <select
              name="estado"
              value={formData.estado ? 'true' : 'false'}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, estado: e.target.value === 'true' }))
              }
              className={`${getInputClass('estado')} appearance-none cursor-pointer`}
              disabled={isSubmitting}
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>

        </div>

        {/* ── Actions ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 border border-outline-variant/10 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[160px] flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg bg-gradient-to-br from-primary-dim to-primary text-on-primary-container hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isSubmitting && (
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
            )}
            {isSubmitting ? 'Guardando…' : isEditMode ? 'Guardar Cambios' : 'Crear Cliente'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

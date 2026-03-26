/**
 * Utilidad de formato de moneda peruana (Soles - S/).
 * Usar en todos los lugares del módulo donde se muestre dinero.
 */

const SOLES_FORMATTER = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formatea un número como moneda peruana.
 * @example formatSoles(1500) → "S/ 1,500.00"
 */
export function formatSoles(val: number): string {
  return SOLES_FORMATTER.format(val);
}

/**
 * Versión compacta para valores grandes en cards de dashboard.
 * @example formatSolesCompact(1500000) → "S/ 1,500k"
 */
export function formatSolesCompact(val: number): string {
  if (val >= 1_000_000) return `S/ ${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `S/ ${(val / 1_000).toFixed(1)}k`;
  return formatSoles(val);
}

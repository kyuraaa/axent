import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as Indonesian Rupiah with abbreviated suffixes for large values.
 * 
 * Rules:
 * - < 1.000.000 → normal (e.g., Rp 750.000)
 * - >= 1.000.000 → jt (juta) (e.g., Rp 1,5 jt)
 * - >= 1.000.000.000 → M (miliar) (e.g., Rp 1 M)
 * - >= 1.000.000.000.000 → T (triliun) (e.g., Rp 1 T)
 */
export function formatRupiah(value: number, withPrefix = true): string {
  const abs = Math.abs(value);
  const prefix = withPrefix ? 'Rp ' : '';
  const sign = value < 0 ? '-' : '';

  if (abs >= 1_000_000_000_000) {
    const t = abs / 1_000_000_000_000;
    const formatted = t % 1 === 0 ? t.toFixed(0) : t.toFixed(1).replace('.', ',');
    return `${sign}${prefix}${formatted} T`;
  }
  if (abs >= 1_000_000_000) {
    const m = abs / 1_000_000_000;
    const formatted = m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace('.', ',');
    return `${sign}${prefix}${formatted} M`;
  }
  if (abs >= 1_000_000) {
    const jt = abs / 1_000_000;
    const formatted = jt % 1 === 0 ? jt.toFixed(0) : jt.toFixed(1).replace('.', ',');
    return `${sign}${prefix}${formatted} jt`;
  }
  return `${sign}${prefix}${abs.toLocaleString('id-ID')}`;
}

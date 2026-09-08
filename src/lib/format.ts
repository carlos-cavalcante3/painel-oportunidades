export function fmtCurrency(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

export function fmtCompact(v: number): string {
  if (v >= 1_000_000) return 'R$ ' + (v / 1_000_000).toFixed(2).replace('.', ',') + 'M';
  if (v >= 1_000) return 'R$ ' + (v / 1_000).toFixed(0) + 'K';
  return fmtCurrency(v);
}

export function daysOpen(dataEntrada: Date | null): number | null {
  if (!dataEntrada) return null;
  const entry = new Date(dataEntrada);
  entry.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24));
}

export type StatusAlerta = 'red' | 'yellow' | 'normal';

export function statusFor(days: number | null): StatusAlerta {
  if (days === null) return 'normal';
  if (days > 10) return 'red';
  if (days > 5) return 'yellow';
  return 'normal';
}

export const statusOrder: Record<StatusAlerta, number> = { red: 0, yellow: 1, normal: 2 };
export const statusLabel: Record<StatusAlerta, string> = {
  red: 'dias sem avanço',
  yellow: 'dias sem avanço',
  normal: 'dias em aberto',
};

export function daysBetween(start: Date | null, end: Date | null): number | null {
  if (!start || !end) return null;
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(0, 0, 0, 0);
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

export function fmtDate(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleDateString('pt-BR');
}

export function fmtDateTime(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function norm(s: string | null | undefined): string {
  return (s || '').replace(/\s+/g, ' ').trim();
}

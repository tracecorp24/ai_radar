import { format, formatDistanceToNowStrict } from "date-fns";
import { tr } from "date-fns/locale";

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return format(new Date(value), "dd MMM yyyy", { locale: tr });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return format(new Date(value), "dd MMM yyyy, HH:mm", { locale: tr });
}

export function formatRelativeTime(value?: string | null) {
  if (!value) return "—";
  return formatDistanceToNowStrict(new Date(value), {
    addSuffix: true,
    locale: tr
  });
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 }).format(
    value
  );
}

export function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

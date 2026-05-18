export function normalizeWhatsAppNumber(value?: string | null) {
  const digits = (value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

export function buildWhatsAppUrl(_phone: string | null | undefined, message: string) {
  const normalized = normalizeWhatsAppNumber("082355148758");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function splitSettingLines(value: unknown) {
  if (typeof value !== "string") return [];
  return value.split(/\n+/).map((line) => line.trim()).filter(Boolean);
}

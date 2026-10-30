// wa.me wants the full international number as digits only. Numbers typed
// without a country code are taken as Tunisian (eight digits).
export function whatsappHref(number: string): string | null {
  const digits = number.replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits.length === 8 ? `216${digits}` : digits}`;
}

/** Strip a phone value to digits suitable for wa.me (country code + number, no +). */
export const normalizeWhatsAppDigits = (raw: string | null | undefined): string => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  if (digits.length >= 11 && digits.length <= 13) return digits;
  return '';
};

export const buildWhatsAppContactUrl = (
  phone: string | null | undefined,
  message?: string,
): string | null => {
  const withCountry = normalizeWhatsAppDigits(phone);
  if (!withCountry) return null;
  const base = `https://wa.me/${withCountry}`;
  if (message) return `${base}?text=${encodeURIComponent(message)}`;
  return base;
};

export const buildPhoneDialUrl = (phone: string | null | undefined): string | null => {
  const withCountry = normalizeWhatsAppDigits(phone);
  if (!withCountry) return null;
  return `tel:+${withCountry}`;
};

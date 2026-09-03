export type IdentityDocumentType = 'cl_rut' | 'foreign_id';

export const FOREIGN_ID_UNKNOWN_COUNTRY = 'unknown';

export function cleanRut(raw: string): string {
  return typeof raw === 'string' ? raw.replace(/[^0-9kK]/g, '').toUpperCase() : '';
}

export function validateRut(raw: string): boolean {
  const cleaned = cleanRut(raw);
  if (cleaned.length < 2) return false;
  const body = cleaned.slice(0, -1);
  const verifier = cleaned.slice(-1);
  let multiplier = 2;
  let sum = 0;
  for (let index = body.length - 1; index >= 0; index--) {
    sum += Number.parseInt(body.charAt(index), 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const expected = 11 - (sum % 11);
  return verifier === (expected === 11 ? '0' : expected === 10 ? 'K' : String(expected));
}

export function formatRut(raw: string, maxLength?: number): string {
  const cleanedValue = cleanRut(raw);
  const cleaned = maxLength ? cleanedValue.slice(0, maxLength) : cleanedValue;
  if (cleaned.length <= 1) return cleaned;
  const body = cleaned.slice(0, -1);
  const verifier = cleaned.slice(-1);
  const groups: string[] = [];
  for (let end = body.length; end > 0; end -= 3) {
    groups.unshift(body.slice(Math.max(0, end - 3), end));
  }
  return `${groups.join('.')}-${verifier}`;
}

export function buildDocumentKeyFromRut(raw: string): string {
  return `cl_rut:${cleanRut(raw)}`;
}

export function cleanForeignIdentityDocument(raw: string): string {
  if (typeof raw !== 'string') return '';
  return raw.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^0-9A-Za-z]/g, '').toUpperCase().slice(0, 32);
}

export function validateForeignIdentityDocument(raw: string): boolean {
  const cleaned = cleanForeignIdentityDocument(raw);
  return cleaned.length >= 3 && cleaned.length <= 32;
}

export function buildDocumentKeyFromForeignIdentityDocument(raw: string, issuingCountry = FOREIGN_ID_UNKNOWN_COUNTRY): string {
  const country = String(issuingCountry || FOREIGN_ID_UNKNOWN_COUNTRY).trim().toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '') || FOREIGN_ID_UNKNOWN_COUNTRY;
  return `foreign_id:${country}:${cleanForeignIdentityDocument(raw)}`;
}

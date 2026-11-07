/** Personal-data detection and masking. Detected values are never stored or echoed back. */

const emailPattern = /[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}/giu
const ibanPattern = /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,4})?\b/giu
// +90 555 123 45 67, 0555-123-4567, (0212) 123 45 67 ...
const phonePattern = /(?:\+?\d[\d\s().-]{8,}\d)/g
const longNumberPattern = /\d{6,}/g

export function containsPersonalData(value: string) {
  if (new RegExp(emailPattern.source, 'iu').test(value)) return true
  if (new RegExp(ibanPattern.source, 'iu').test(value)) return true
  for (const match of value.match(phonePattern) || []) {
    if (match.replace(/\D/g, '').length >= 10) return true
  }
  // TC kimlik no / card / account style digit runs.
  return /\d{9,}/.test(value.replace(/[\s-]/g, ''))
}

export function maskPersonalData(value: string) {
  return value
    .replace(emailPattern, '[e-posta]')
    .replace(ibanPattern, '[hesap]')
    .replace(phonePattern, (match) => (match.replace(/\D/g, '').length >= 7 ? '[telefon]' : match))
    .replace(longNumberPattern, '[numara]')
}

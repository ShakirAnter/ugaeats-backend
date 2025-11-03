export function normalizeUgandaPhone(input?: string): string | null {
  if (!input) return null;
  let s = String(input).trim();
  // remove spaces, dashes, parentheses
  s = s.replace(/[\s\-()]/g, '');
  // If starts with 0 and has 10 digits (0XXXXXXXXX) -> convert to +256XXXXXXXXX
  const local = /^0(\d{9})$/;
  const intl = /^\+256(\d{9})$/;
  if (local.test(s)) {
    return '+256' + s.slice(1);
  }
  if (intl.test(s)) {
    return s;
  }
  // If user accidentally provided 9 digits without leading 0, try to accept and prefix +256
  const nine = /^(\d{9})$/;
  if (nine.test(s)) {
    return '+256' + s;
  }
  return null;
}

export function isValidUgandaPhone(input?: string): boolean {
  if (!input) return false;
  return /^\+256\d{9}$/.test(input);
}

export type UserGender = 'MALE' | 'FEMALE' | 'OTHER';

export function normalizePersonName(name: string | null | undefined) {
  return (name || '').trim().replace(/\s+/g, ' ');
}

export function extractLastName(name: string | null | undefined) {
  const normalized = normalizePersonName(name);
  if (!normalized) return '';
  const commaParts = normalized.split(',').map((part) => part.trim()).filter(Boolean);
  if (commaParts.length >= 2 && commaParts[0]) return commaParts[0];
  const parts = normalized.split(' ').filter(Boolean);
  return parts[parts.length - 1] || '';
}

export function formatLastName(name: string | null | undefined, fallback = '') {
  const lastName = extractLastName(name);
  return lastName || fallback;
}

export function formatContactName(
  name: string | null | undefined,
  gender?: UserGender | null,
  fallback = '',
) {
  if (gender === 'OTHER') {
    const normalized = normalizePersonName(name);
    return normalized || fallback;
  }
  return formatLastName(name, fallback);
}

/**
 * Utility to mask sensitive data for logging purposes.
 * Shows only the last 4 characters of IDs or masks the local part of emails.
 */
export function maskData(value: string | undefined | null): string {
  if (!value) return 'null';

  // Specific Stripe IDs
  if (value.startsWith('cus_') || value.startsWith('sub_') || value.startsWith('price_')) {
    const parts = value.split('_');
    const type = parts[0];
    const rest = parts[1] || '';
    if (rest.length <= 4) return value;
    return `${type}_****${rest.slice(-4)}`;
  }

  // Emails
  if (value.includes('@')) {
    const [local, domain] = value.split('@');
    if (local.length <= 1) return `*@${domain}`;
    return `${local[0]}****@${domain}`;
  }

  // General IDs or values
  if (value.length <= 4) return '****';
  return `****${value.slice(-4)}`;
}

/**
 * Convenience method to mask multiple fields in an object
 */
export function maskObject<T extends Record<string, unknown> | null | undefined>(
  obj: T,
  keysToMask: string[],
): T {
  if (!obj || typeof obj !== 'object') return obj;

  const masked: Record<string, unknown> = { ...obj };
  for (const key of keysToMask) {
    const value = masked[key];
    if (typeof value === 'string') {
      masked[key] = maskData(value);
    }
  }
  return masked as T;
}

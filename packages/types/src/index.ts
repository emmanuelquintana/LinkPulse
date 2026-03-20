export type LinkStatus = 'ACTIVE' | 'ARCHIVED' | 'BLOCKED' | 'EXPIRED';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
}

export interface RedirectLookupResult {
  id: string;
  originalUrl: string;
  status: LinkStatus;
  expiresAt: string | null;
}

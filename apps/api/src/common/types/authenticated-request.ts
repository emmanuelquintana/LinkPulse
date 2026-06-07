import type { Request } from 'express';
import type { JWTPayload } from 'jose';

/**
 * Claims del usuario autenticado extraídas del JWT de Supabase.
 * Extiende `JWTPayload` (incluye `sub`, `iss`, `aud`, …) y añade los claims
 * personalizados que usamos en la app.
 */
/** Metadatos de usuario que Supabase incluye en el claim `user_metadata`. */
export interface SupabaseUserMetadata {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  avatar_url?: string;
  picture?: string;
}

export interface AuthenticatedUser extends JWTPayload {
  /** ID del usuario (claim `sub`). Garantizado por `SupabaseAuthGuard`. */
  sub: string;
  email?: string;
  user_metadata?: SupabaseUserMetadata;
}

/**
 * Request de Express con el usuario adjuntado por `SupabaseAuthGuard`.
 * El guard siempre establece `user` antes de que el handler se ejecute, por lo
 * que aquí es obligatorio.
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

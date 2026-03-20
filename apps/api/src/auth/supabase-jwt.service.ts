import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

@Injectable()
export class SupabaseJwtService {
  private readonly issuer = process.env.SUPABASE_JWT_ISSUER;
  private readonly audience = 'authenticated';
  private readonly jwks = createRemoteJWKSet(
    new URL(process.env.SUPABASE_JWKS_URL ?? `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
  );

  async verifyAccessToken(token: string): Promise<JWTPayload> {
    if (!this.issuer) {
      throw new UnauthorizedException('SUPABASE_JWT_ISSUER is not configured');
    }

    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
      });

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid Supabase access token');
    }
  }
}

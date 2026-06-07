import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseJwtService } from '../../auth/supabase-jwt.service.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly jwtService: SupabaseJwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = header.replace('Bearer ', '').trim();
    const payload = await this.jwtService.verifyAccessToken(token);

    if (typeof payload.sub !== 'string') {
      throw new UnauthorizedException('Access token is missing the subject claim');
    }

    request.user = { ...payload, sub: payload.sub };
    return true;
  }
}

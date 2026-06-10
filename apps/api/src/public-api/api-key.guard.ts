import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { hashApiKey } from '../api-keys/api-keys.service.js';

export interface ApiKeyContext {
  apiKeyId: string;
  workspaceId: string;
  createdBy: string;
}

export type PublicApiRequest = Request & { apiKey: ApiKeyContext };

/**
 * Autenticación de la capa pública para desarrolladores. Acepta la clave en
 * `Authorization: Bearer lp_...` o en el header `x-api-key`. No usa Supabase:
 * es una capa externa e independiente del backend interno.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<PublicApiRequest>();

    const header = req.headers.authorization;
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const key = bearer ?? (req.headers['x-api-key'] as string | undefined);

    if (!key || !key.startsWith('lp_')) {
      throw new UnauthorizedException(
        'Missing API key. Send it as "Authorization: Bearer lp_..." or "x-api-key".',
      );
    }

    const record = await this.prisma.apiKey.findUnique({
      where: { keyHash: hashApiKey(key) },
    });

    if (!record || record.revokedAt) {
      throw new UnauthorizedException('Invalid or revoked API key.');
    }

    req.apiKey = {
      apiKeyId: record.id,
      workspaceId: record.workspaceId,
      createdBy: record.createdBy,
    };

    // Marca de último uso, sin bloquear la respuesta.
    this.prisma.apiKey
      .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    return true;
  }
}

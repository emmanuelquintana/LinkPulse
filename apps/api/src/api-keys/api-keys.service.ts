import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { WorkspaceAccessService } from '../workspaces/workspace-access.service.js';

export const hashApiKey = (key: string): string =>
  createHash('sha256').update(key).digest('hex');

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
  ) {}

  async list(userId: string, workspaceId: string) {
    await this.access.assertPermission(userId, workspaceId, 'canManageLinks');
    return this.prisma.apiKey.findMany({
      where: { workspaceId, revokedAt: null },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Crea una clave nueva. La clave completa SOLO se devuelve aquí, una vez;
   * en la base de datos queda únicamente su hash.
   */
  async create(userId: string, workspaceId: string, name: string) {
    await this.access.assertPermission(userId, workspaceId, 'canManageLinks');

    const plainKey = `lp_${randomBytes(24).toString('hex')}`;
    const created = await this.prisma.apiKey.create({
      data: {
        workspaceId,
        name: name.trim().slice(0, 80) || 'API key',
        keyPrefix: plainKey.slice(0, 10),
        keyHash: hashApiKey(plainKey),
        createdBy: userId,
      },
      select: { id: true, name: true, keyPrefix: true, createdAt: true },
    });

    return { ...created, key: plainKey };
  }

  async revoke(userId: string, workspaceId: string, keyId: string) {
    await this.access.assertPermission(userId, workspaceId, 'canManageLinks');

    const key = await this.prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!key || key.workspaceId !== workspaceId || key.revokedAt) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });
    return { id: keyId, revoked: true };
  }
}

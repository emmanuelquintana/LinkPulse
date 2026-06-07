import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { WorkspacePermission } from './workspace-permissions.js';

/**
 * Servicio reutilizable de control de acceso a workspaces. Sólo depende de
 * Prisma, por lo que cualquier módulo (links, billing, email-marketing) puede
 * importar `WorkspacesModule` y usarlo sin crear dependencias circulares.
 */
@Injectable()
export class WorkspaceAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /** Devuelve la membresía del usuario en el workspace, o lanza si no existe. */
  async getMembership(userId: string, workspaceId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!membership) {
      throw new ForbiddenException('No tienes acceso a este workspace');
    }

    return membership;
  }

  /** Lanza si el usuario no es miembro del workspace. */
  async assertMember(userId: string, workspaceId: string) {
    await this.getMembership(userId, workspaceId);
  }

  /**
   * Verifica que el usuario tenga un permiso concreto. El OWNER siempre lo
   * tiene; el resto depende del flag almacenado en su membresía.
   */
  async assertPermission(
    userId: string,
    workspaceId: string,
    permission: WorkspacePermission,
  ) {
    const membership = await this.getMembership(userId, workspaceId);

    if (membership.role === 'OWNER') return membership;

    if (!membership[permission]) {
      throw new ForbiddenException(
        `No tienes el permiso "${permission}" en este workspace`,
      );
    }

    return membership;
  }

  /** Garantiza que el workspace existe (para webhooks/operaciones internas). */
  async ensureWorkspaceExists(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace no encontrado');
    }
    return workspace;
  }
}

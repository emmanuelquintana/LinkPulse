import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class PlanLimitGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { workspaceId } = request.body;

    if (!workspaceId) {
      // If workspaceId is not in body, we might be using it in params (e.g. for list/others)
      // but for link creation it's mandatory in body.
      return true;
    }

    // Get workspace plan and current link count
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        plan: true,
        _count: {
          select: { links: true },
        },
      },
    });

    if (!workspace) {
      throw new ForbiddenException('Workspace not found');
    }

    // Limits
    const isFree = workspace.plan === 'FREE';
    const linkCount = workspace._count.links;
    const FREE_LINK_LIMIT = 10;

    if (isFree && linkCount >= FREE_LINK_LIMIT) {
      throw new ForbiddenException(
        `Workspace link limit reached (${FREE_LINK_LIMIT} links). Please upgrade to PRO for unlimited links.`
      );
    }

    return true;
  }
}

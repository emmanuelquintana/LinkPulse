import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateLinkDto } from "./dto/create-link.dto.js";
import { customAlphabet } from "nanoid";
import { PaginationQueryDto } from "../shared/dto/pagination-query.dto.js";
import { RedisService } from "../redis/redis.service.js";
import { ProfilesService } from "../profiles/profiles.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { notif } from "../notifications/notification-messages.js";
import { WorkspaceAccessService } from "../workspaces/workspace-access.service.js";

// Alphabet chosen to avoid ambiguous characters
const nanoid = customAlphabet(
  "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ",
  7,
);

@Injectable()
export class LinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly profilesService: ProfilesService,
    private readonly notificationsService: NotificationsService,
    private readonly access: WorkspaceAccessService,
  ) {}

  async create(userId: string, email: string, createLinkDto: CreateLinkDto) {
    const { destination, title, workspaceId, alias, campaignId } =
      createLinkDto;

    // Ensure profile exists in our DB before creating link (foreign key constraint)
    await this.profilesService.bootstrapProfile(userId, email);

    // Validate workspace if provided
    if (workspaceId) {
      // Requiere ser miembro y tener permiso para gestionar links.
      await this.access.assertPermission(userId, workspaceId, "canManageLinks");
    } else {
      // Note: schema says workspaceId is required. We must handle missing workspaceId.
      // The user's checklist specifies workspace logic. Let's assume links must belong to a workspace.
      throw new ForbiddenException(
        "A workspaceId is required to create a link",
      );
    }

    // Validate campaign if provided
    if (campaignId) {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        throw new NotFoundException(`Campaign with ID ${campaignId} not found`);
      }

      if (campaign.workspaceId !== workspaceId) {
        throw new ForbiddenException(
          "Campaign does not belong to the specified workspace",
        );
      }
    }

    // Determine customAlias
    if (alias) {
      const existing = await this.prisma.link.findUnique({
        where: { customAlias: alias },
      });
      if (existing) {
        throw new ConflictException(`The alias '${alias}' is already taken`);
      }
    }

    // Generate a unique short code
    let shortCode = "";
    let isUnique = false;
    while (!isUnique) {
      shortCode = nanoid();
      const existing = await this.prisma.link.findUnique({
        where: { shortCode },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    const link = await this.prisma.link.create({
      data: {
        originalUrl: destination,
        shortCode,
        customAlias: alias || null,
        title,
        workspaceId,
        campaignId: campaignId || null,
        createdBy: userId,
      },
    });

    const linkName = title || alias || shortCode;
    await this.notificationsService.createForUser({
      userId,
      workspaceId,
      ...notif.linkCreatedSelf(linkName),
    });

    await this.notificationsService.createForWorkspaceMembers(
      workspaceId,
      notif.linkCreatedWorkspace(linkName),
      [userId],
    );

    return link;
  }

  async findAllForUser(userId: string, paginationQuery: PaginationQueryDto) {
    const { page = 1, limit = 20 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.link.findMany({
        where: {
          OR: [
            { createdBy: userId },
            { workspace: { members: { some: { userId } } } },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          workspace: true,
          campaign: true,
          _count: {
            select: { clickEvents: true },
          },
        },
      }),
      this.prisma.link.count({
        where: {
          OR: [
            { createdBy: userId },
            { workspace: { members: { some: { userId } } } },
          ],
        },
      }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        clicksCount: item._count?.clickEvents ?? 0,
      })),
      page,
      size: limit,
      elements: total,
    };
  }

  async findOne(userId: string, id: string) {
    const link = await this.prisma.link.findUnique({
      where: { id },
      include: {
        workspace: true,
        campaign: true,
        _count: {
          select: { clickEvents: true },
        },
      },
    });

    if (!link) {
      throw new NotFoundException(`Link with ID ${id} not found`);
    }

    // Validate ownership or workspace membership
    if (link.createdBy !== userId) {
      if (!link.workspaceId) {
        throw new ForbiddenException("You do not have access to this link");
      }

      const isMember = await this.prisma.workspaceMember.findFirst({
        where: {
          workspaceId: link.workspaceId,
          userId,
        },
      });

      if (!isMember) {
        throw new ForbiddenException("You do not have access to this link");
      }
    }

    return {
      ...link,
      clicksCount: link._count?.clickEvents ?? 0,
    };
  }

  async partialUpdate(
    userId: string,
    id: string,
    data: Partial<CreateLinkDto>,
  ) {
    // Rely on findOne for ownership checks
    const currentLink = await this.findOne(userId, id);

    // If alias is being changed, ensure it's unique
    if (data.alias) {
      const existing = await this.prisma.link.findUnique({
        where: { customAlias: data.alias },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `The alias '${data.alias}' is already taken`,
        );
      }
    }

    const updated = await this.prisma.link.update({
      where: { id },
      data: {
        title: data.title,
        originalUrl: data.destination,
        customAlias: data.alias,
        workspaceId: data.workspaceId,
        campaignId: data.campaignId,
      },
    });

    // Invalidate cache for BOTH the random shortCode and customAlias
    await this.redis.del(`short:${updated.shortCode}`);
    if (currentLink.customAlias) {
      await this.redis.del(`short:${currentLink.customAlias}`);
    }
    if (updated.customAlias) {
      await this.redis.del(`short:${updated.customAlias}`);
    }

    return updated;
  }

  async archive(userId: string, id: string) {
    const currentLink = await this.findOne(userId, id); // validates access

    const archived = await this.prisma.link.update({
      where: { id },
      data: { status: "ARCHIVED" }, // using LinkStatus enum via string literal
    });

    // Invalidate cache
    await this.redis.del(`short:${archived.shortCode}`);
    if (archived.customAlias) {
      await this.redis.del(`short:${archived.customAlias}`);
    }

    const archivedName =
      currentLink.title || archived.customAlias || archived.shortCode;
    await this.notificationsService.createForUser({
      userId,
      workspaceId: archived.workspaceId,
      ...notif.linkArchived(archivedName),
    });

    await this.notificationsService.createForWorkspaceMembers(
      archived.workspaceId,
      notif.linkArchived(archivedName),
      [userId],
    );

    return archived;
  }
}

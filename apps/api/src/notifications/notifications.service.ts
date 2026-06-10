import { Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType, Prisma } from "@linkpulse/db";
import { PrismaService } from "../prisma/prisma.service.js";
import { NotificationQueryDto } from "./dto/notification-query.dto.js";

interface CreateNotificationInput {
  userId: string;
  workspaceId?: string | null;
  type?: NotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
  metadata?: { key: string; params: Record<string, string> } | null;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForUser(input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        workspaceId: input.workspaceId ?? null,
        type: input.type ?? "SYSTEM",
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
        metadata: input.metadata ?? Prisma.JsonNull,
      },
    });
  }

  async createForWorkspaceMembers(
    workspaceId: string,
    input: Omit<CreateNotificationInput, "userId" | "workspaceId">,
    excludeUserIds: string[] = [],
  ) {
    const members = await this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        userId:
          excludeUserIds.length > 0 ? { notIn: excludeUserIds } : undefined,
      },
      select: { userId: true },
    });

    if (members.length === 0) {
      return { count: 0 };
    }

    return this.prisma.notification.createMany({
      data: members.map((member) => ({
        userId: member.userId,
        workspaceId,
        type: input.type ?? "SYSTEM",
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
        metadata: input.metadata ?? Prisma.JsonNull,
      })),
    });
  }

  async findAllForUser(userId: string, query: NotificationQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const skip = (page - 1) * limit;
    const where = {
      userId,
      ...(query.status === "unread" ? { readAt: null } : {}),
      ...(query.status === "read" ? { readAt: { not: null } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items,
      page,
      size: limit,
      elements: total,
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });

    return { count };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notification with ID ${notificationId} not found`,
      );
    }

    if (notification.readAt) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return { updated: result.count };
  }

  async deleteForUser(userId: string, notificationId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(
        `Notification with ID ${notificationId} not found`,
      );
    }

    return { deleted: result.count };
  }
}

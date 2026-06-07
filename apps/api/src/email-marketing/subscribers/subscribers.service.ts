import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@linkpulse/db';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateSubscriberDto } from '../dto/create-subscriber.dto.js';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto.js';
import type { PaginatedResult } from '../../shared/types/paginated-result.js';

export type SubscriberWithTags = Prisma.EmailSubscriberGetPayload<{
  include: { tags: true };
}>;

@Injectable()
export class SubscribersService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertWorkspaceMember(userId: string, workspaceId: string) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
    });
    if (!member) {
      throw new ForbiddenException('You do not have access to this workspace');
    }
  }

  async create(userId: string, dto: CreateSubscriberDto): Promise<SubscriberWithTags> {
    await this.assertWorkspaceMember(userId, dto.workspaceId);

    const existing = await this.prisma.emailSubscriber.findUnique({
      where: { workspaceId_email: { workspaceId: dto.workspaceId, email: dto.email } },
    });
    if (existing) {
      throw new ConflictException('Subscriber with this email already exists in the workspace');
    }

    return this.prisma.emailSubscriber.create({
      data: {
        workspaceId: dto.workspaceId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        tags: dto.tags?.length
          ? { create: dto.tags.map((name) => ({ name })) }
          : undefined,
      },
      include: { tags: true },
    });
  }

  async findAll(
    userId: string,
    workspaceId: string,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<SubscriberWithTags>> {
    await this.assertWorkspaceMember(userId, workspaceId);

    const page = pagination.page ?? 1;
    const size = pagination.limit ?? 20;
    const skip = (page - 1) * size;

    const [items, elements] = await Promise.all([
      this.prisma.emailSubscriber.findMany({
        where: { workspaceId },
        include: { tags: true },
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.emailSubscriber.count({ where: { workspaceId } }),
    ]);

    return { items, page, size, elements };
  }

  async findOne(userId: string, workspaceId: string, id: string): Promise<SubscriberWithTags> {
    await this.assertWorkspaceMember(userId, workspaceId);

    const subscriber = await this.prisma.emailSubscriber.findFirst({
      where: { id, workspaceId },
      include: { tags: true },
    });
    if (!subscriber) throw new NotFoundException('Subscriber not found');
    return subscriber;
  }

  async update(
    userId: string,
    workspaceId: string,
    id: string,
    data: Partial<CreateSubscriberDto>,
  ): Promise<SubscriberWithTags> {
    await this.assertWorkspaceMember(userId, workspaceId);

    const subscriber = await this.prisma.emailSubscriber.findFirst({
      where: { id, workspaceId },
    });
    if (!subscriber) throw new NotFoundException('Subscriber not found');

    return this.prisma.emailSubscriber.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
      },
      include: { tags: true },
    });
  }

  async remove(userId: string, workspaceId: string, id: string) {
    await this.assertWorkspaceMember(userId, workspaceId);

    const subscriber = await this.prisma.emailSubscriber.findFirst({
      where: { id, workspaceId },
    });
    if (!subscriber) throw new NotFoundException('Subscriber not found');

    await this.prisma.emailSubscriber.delete({ where: { id } });
    return { id };
  }

  async bulkImport(
    userId: string,
    workspaceId: string,
    csvContent: string,
  ): Promise<{ imported: number; skipped: number }> {
    await this.assertWorkspaceMember(userId, workspaceId);

    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return { imported: 0, skipped: 0 };

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));

    const emailIdx = headers.indexOf('email');
    const firstNameIdx = headers.indexOf('firstname');
    const lastNameIdx = headers.indexOf('lastname');
    const tagsIdx = headers.indexOf('tags');

    if (emailIdx === -1) return { imported: 0, skipped: 0 };

    let imported = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/"/g, ''));
      const email = cols[emailIdx];
      if (!email || !email.includes('@')) {
        skipped++;
        continue;
      }

      const firstName = firstNameIdx !== -1 ? cols[firstNameIdx] || undefined : undefined;
      const lastName = lastNameIdx !== -1 ? cols[lastNameIdx] || undefined : undefined;
      const rawTags = tagsIdx !== -1 ? cols[tagsIdx] : '';
      const tags = rawTags ? rawTags.split('|').map((t) => t.trim()).filter(Boolean) : [];

      try {
        await this.prisma.emailSubscriber.upsert({
          where: { workspaceId_email: { workspaceId, email } },
          create: {
            workspaceId,
            email,
            firstName,
            lastName,
            tags: tags.length ? { create: tags.map((name) => ({ name })) } : undefined,
          },
          update: {
            firstName: firstName ?? undefined,
            lastName: lastName ?? undefined,
          },
        });
        imported++;
      } catch {
        skipped++;
      }
    }

    return { imported, skipped };
  }
}

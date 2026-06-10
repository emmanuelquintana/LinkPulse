import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import { PrismaService } from '../prisma/prisma.service.js';

const nanoid = customAlphabet(
  '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ',
  7,
);

/**
 * Lógica de la API pública para desarrolladores. Siempre opera dentro del
 * workspace dueño de la API key; nunca cruza datos de otros workspaces.
 */
@Injectable()
export class PublicApiService {
  constructor(private readonly prisma: PrismaService) {}

  private shortUrl(code: string): string {
    const base = process.env.REDIRECTOR_URL ?? 'http://localhost:3002';
    return `${base.replace(/\/$/, '')}/${code}`;
  }

  private serializeLink(link: {
    id: string;
    shortCode: string;
    customAlias: string | null;
    originalUrl: string;
    title: string | null;
    status: string;
    createdAt: Date;
  }) {
    return {
      id: link.id,
      shortCode: link.customAlias ?? link.shortCode,
      shortUrl: this.shortUrl(link.customAlias ?? link.shortCode),
      destination: link.originalUrl,
      title: link.title,
      status: link.status,
      createdAt: link.createdAt,
    };
  }

  async createLink(
    workspaceId: string,
    createdBy: string,
    input: { destination: string; title?: string; alias?: string },
  ) {
    if (input.alias) {
      const taken = await this.prisma.link.findUnique({
        where: { customAlias: input.alias },
      });
      if (taken) {
        throw new ConflictException(`Alias '${input.alias}' is already taken`);
      }
    }

    let shortCode = '';
    let unique = false;
    while (!unique) {
      shortCode = nanoid();
      const existing = await this.prisma.link.findUnique({ where: { shortCode } });
      if (!existing) unique = true;
    }

    const link = await this.prisma.link.create({
      data: {
        workspaceId,
        createdBy,
        originalUrl: input.destination,
        shortCode,
        customAlias: input.alias ?? null,
        title: input.title ?? null,
      },
    });

    return this.serializeLink(link);
  }

  async listLinks(workspaceId: string, page: number, limit: number) {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.link.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { _count: { select: { clickEvents: true } } },
      }),
      this.prisma.link.count({ where: { workspaceId } }),
    ]);

    return {
      items: items.map((l) => ({
        ...this.serializeLink(l),
        clicks: l._count.clickEvents,
      })),
      page: Math.max(page, 1),
      size: take,
      elements: total,
    };
  }

  private async findOwnedLink(workspaceId: string, id: string) {
    const link = await this.prisma.link.findUnique({
      where: { id },
      include: { _count: { select: { clickEvents: true } } },
    });
    if (!link || link.workspaceId !== workspaceId) {
      throw new NotFoundException('Link not found');
    }
    return link;
  }

  async getLink(workspaceId: string, id: string) {
    const link = await this.findOwnedLink(workspaceId, id);
    return { ...this.serializeLink(link), clicks: link._count.clickEvents };
  }

  async getLinkStats(workspaceId: string, id: string) {
    const link = await this.findOwnedLink(workspaceId, id);

    const [byCountry, byDevice, recent] = await Promise.all([
      this.prisma.clickEvent.groupBy({
        by: ['country'],
        where: { linkId: id },
        _count: { _all: true },
        orderBy: { _count: { country: 'desc' } },
        take: 10,
      }),
      this.prisma.clickEvent.groupBy({
        by: ['deviceType'],
        where: { linkId: id },
        _count: { _all: true },
      }),
      this.prisma.clickEvent.findMany({
        where: { linkId: id },
        orderBy: { clickedAt: 'desc' },
        take: 20,
        select: {
          clickedAt: true,
          country: true,
          city: true,
          deviceType: true,
          browser: true,
          os: true,
          referer: true,
        },
      }),
    ]);

    return {
      linkId: link.id,
      shortCode: link.customAlias ?? link.shortCode,
      totalClicks: link._count.clickEvents,
      byCountry: byCountry.map((c) => ({
        country: c.country ?? 'unknown',
        clicks: c._count._all,
      })),
      byDevice: byDevice.map((d) => ({
        device: d.deviceType,
        clicks: d._count._all,
      })),
      recentClicks: recent,
    };
  }
}

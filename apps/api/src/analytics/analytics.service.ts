import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getClicksByDay(userId: string, days: number = 7) {
    // Get the range including today
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const clicks = await this.prisma.clickEvent.findMany({
      where: {
        link: {
          OR: [
            { createdBy: userId },
            { workspace: { members: { some: { userId } } } },
          ],
        },
        clickedAt: {
          gte: startDate,
        },
      },
      select: {
        clickedAt: true,
      },
    });

    // Group by day
    const counts: Record<string, number> = {};
    
    // Initialize with 0s for the requested range
    for (let i = 0; i < days; i++) {
       const d = new Date();
       d.setDate(d.getDate() - i);
       const dateStr = d.toISOString().split('T')[0];
       counts[dateStr] = 0;
    }

    // Populate counts
    clicks.forEach(click => {
      const dateStr = click.clickedAt.toISOString().split('T')[0];
      if (counts[dateStr] !== undefined) {
        counts[dateStr]++;
      }
    });

    // Convert to sorted array [oldest -> newest]
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

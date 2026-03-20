import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check() {
    const results = {
      database: 'down',
      cache: 'down',
      status: 'ok',
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      results.database = 'up';
    } catch (e) {
      this.logger.error('Health Check: Database is down');
      results.status = 'error';
    }

    try {
      // Upstash Redis client uses 'ping' directly
      const isAlive = await this.redis.client.ping();
      results.cache = isAlive === 'PONG' ? 'up' : 'down';
      if (results.cache === 'down') results.status = 'error';
    } catch (e) {
      this.logger.error('Health Check: Cache is down');
      results.status = 'error';
    }

    return {
      service: 'api',
      ...results,
      timestamp: new Date().toISOString(),
    };
  }
}

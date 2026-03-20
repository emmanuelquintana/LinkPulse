import { Injectable } from '@nestjs/common';
import { Redis } from '@upstash/redis';

@Injectable()
export class UpstashRedisService {
  readonly client = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
  });

  async get<T>(key: string): Promise<T | null> {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return null;
    }

    return this.client.get<T>(key);
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return;
    }

    if (ttlSeconds) {
      await this.client.set(key, value, { ex: ttlSeconds });
      return;
    }

    await this.client.set(key, value);
  }

  async incrementRateLimit(key: string, windowSeconds: number): Promise<number> {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return 1;
    }

    const pipeline = this.client.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, windowSeconds);
    const [count] = await pipeline.exec<number[]>();
    return Number(count ?? 1);
  }
}

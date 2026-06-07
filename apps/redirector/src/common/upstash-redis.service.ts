import { Injectable, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';

/**
 * Cliente de Upstash Redis para caché y rate-limit.
 *
 * Todas las operaciones son **fail-open**: si Redis no está configurado o no es
 * alcanzable (host caído, DNS, timeout…), el redirector NO falla — simplemente
 * sigue sin caché ni rate-limit, resolviendo contra la base de datos. Redis es
 * una optimización, no una dependencia dura del redireccionamiento.
 */
@Injectable()
export class UpstashRedisService {
  private readonly logger = new Logger(UpstashRedisService.name);
  private outageReported = false;

  readonly client = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
  });

  private get enabled(): boolean {
    return Boolean(
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
    );
  }

  /** Registra el fallo de Redis una sola vez por caída para no inundar los logs. */
  private reportOutage(error: unknown): void {
    if (this.outageReported) return;
    this.outageReported = true;
    const detail = error instanceof Error ? error.message : String(error);
    this.logger.warn(
      `Redis no disponible (${detail}). El redirector continúa sin caché ni rate-limit.`,
    );
  }

  private recover(): void {
    this.outageReported = false;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null;

    try {
      const value = await this.client.get<T>(key);
      this.recover();
      return value;
    } catch (error) {
      this.reportOutage(error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.enabled) return;

    try {
      if (ttlSeconds) {
        await this.client.set(key, value, { ex: ttlSeconds });
      } else {
        await this.client.set(key, value);
      }
      this.recover();
    } catch (error) {
      this.reportOutage(error);
    }
  }

  async incrementRateLimit(key: string, windowSeconds: number): Promise<number> {
    if (!this.enabled) return 1;

    try {
      const pipeline = this.client.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, windowSeconds);
      const [count] = await pipeline.exec<number[]>();
      this.recover();
      return Number(count ?? 1);
    } catch (error) {
      this.reportOutage(error);
      // Fail-open: si Redis está caído, permitimos la petición (sin rate-limit).
      return 1;
    }
  }
}

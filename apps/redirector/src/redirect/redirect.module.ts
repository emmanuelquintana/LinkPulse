import { Module } from '@nestjs/common';
import { RedirectController } from './redirect.controller.js';
import { RedirectService } from './redirect.service.js';
import { UpstashRedisService } from '../common/upstash-redis.service.js';

@Module({
  controllers: [RedirectController],
  providers: [RedirectService, UpstashRedisService],
})
export class RedirectModule {}

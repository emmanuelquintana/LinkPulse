import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module.js';
import { RedirectModule } from './redirect/redirect.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { EmailTrackingModule } from './email-tracking/email-tracking.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    PrismaModule,
    HealthModule,
    RedirectModule,
    EmailTrackingModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SubscribersController } from './subscribers/subscribers.controller.js';
import { SubscribersService } from './subscribers/subscribers.service.js';
import { EmailCampaignsController } from './campaigns/email-campaigns.controller.js';
import { EmailCampaignsService } from './campaigns/email-campaigns.service.js';
import { EmailSenderService } from './campaigns/email-sender.service.js';
import { EmailWebhooksController } from './webhooks/email-webhooks.controller.js';
import { EmailAnalyticsController } from './analytics/email-analytics.controller.js';
import { EmailAnalyticsService } from './analytics/email-analytics.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } }),
  ],
  controllers: [
    SubscribersController,
    EmailCampaignsController,
    EmailWebhooksController,
    EmailAnalyticsController,
  ],
  providers: [
    SubscribersService,
    EmailCampaignsService,
    EmailSenderService,
    EmailAnalyticsService,
  ],
})
export class EmailMarketingModule {}

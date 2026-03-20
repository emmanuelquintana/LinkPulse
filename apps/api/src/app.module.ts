import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./health/health.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { ProfilesModule } from "./profiles/profiles.module.js";
import { WorkspacesModule } from "./workspaces/workspaces.module.js";
import { TraceIdMiddleware } from "./shared/middleware/trace-id.middleware.js";
import { LinksModule } from './links/links.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { CampaignsModule } from './campaigns/campaigns.module.js';
import { BillingModule } from './billing/billing.module.js';
import { APP_INTERCEPTOR } from "@nestjs/core";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    PrismaModule,
    HealthModule,
    ProfilesModule,
    WorkspacesModule,
    LinksModule,
    AnalyticsModule,
    CampaignsModule,
    BillingModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceIdMiddleware).forRoutes("*");
  }
}
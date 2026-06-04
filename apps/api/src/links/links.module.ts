import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { RedisModule } from "../redis/redis.module.js";
import { LinksController } from "./links.controller.js";
import { LinksService } from "./links.service.js";

import { ProfilesModule } from "../profiles/profiles.module.js";
import { NotificationsModule } from "../notifications/notifications.module.js";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RedisModule,
    ProfilesModule,
    NotificationsModule,
  ],
  controllers: [LinksController],
  providers: [LinksService],
})
export class LinksModule {}

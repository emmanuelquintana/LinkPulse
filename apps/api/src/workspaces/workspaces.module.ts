import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { WorkspacesController } from "./workspaces.controller.js";
import { WorkspacesService } from "./workspaces.service.js";
import { WorkspaceAccessService } from "./workspace-access.service.js";
import { EmailSenderService } from "../email-marketing/campaigns/email-sender.service.js";

import { ProfilesModule } from "../profiles/profiles.module.js";
import { NotificationsModule } from "../notifications/notifications.module.js";

@Module({
  imports: [AuthModule, PrismaModule, ProfilesModule, NotificationsModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspaceAccessService, EmailSenderService],
  exports: [WorkspaceAccessService],
})
export class WorkspacesModule {}

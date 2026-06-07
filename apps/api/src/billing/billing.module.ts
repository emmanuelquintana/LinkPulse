import { Module } from '@nestjs/common';
import { BillingService } from './billing.service.js';
import { BillingController } from './billing.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { WorkspacesModule } from '../workspaces/workspaces.module.js';

@Module({
  imports: [PrismaModule, AuthModule, WorkspacesModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}

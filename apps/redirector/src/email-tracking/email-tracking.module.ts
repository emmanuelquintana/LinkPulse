import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { EmailTrackingController } from './email-tracking.controller.js';
import { EmailTrackingService } from './email-tracking.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [EmailTrackingController],
  providers: [EmailTrackingService],
})
export class EmailTrackingModule {}

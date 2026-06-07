import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.js';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard.js';
import { AnalyticsService } from './analytics.service.js';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('clicks')
  @ApiOperation({ summary: 'Get daily clicks for a period' })
  getClicksPerDay(
    @Req() req: AuthenticatedRequest,
    @Query('days') days?: string
  ) {
    const userId = req.user?.sub;
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.analyticsService.getClicksByDay(userId, daysNum);
  }
}

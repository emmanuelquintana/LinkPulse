import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard.js';
import { EmailAnalyticsService } from './email-analytics.service.js';

@ApiTags('email-marketing / analytics')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('email-campaigns')
export class EmailAnalyticsController {
  constructor(private readonly analyticsService: EmailAnalyticsService) {}

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get advanced stats for an email campaign' })
  getStats(
    @Req() req: Request & { user?: any },
    @Query('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.analyticsService.getCampaignStats(req.user?.sub, workspaceId, id);
  }
}

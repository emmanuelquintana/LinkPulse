import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.js';
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
    @Req() req: AuthenticatedRequest,
    @Query('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.analyticsService.getCampaignStats(req.user?.sub, workspaceId, id);
  }
}

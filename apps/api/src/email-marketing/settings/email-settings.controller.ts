import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.js';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard.js';
import { EmailSettingsService } from './email-settings.service.js';
import { UpsertEmailSettingsDto, TestEmailDto } from '../dto/email-settings.dto.js';

@ApiTags('email-marketing / settings')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('email-settings')
export class EmailSettingsController {
  constructor(private readonly settingsService: EmailSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get email settings for a workspace' })
  get(@Req() req: AuthenticatedRequest, @Query('workspaceId') workspaceId: string) {
    return this.settingsService.getSettings(req.user?.sub, workspaceId);
  }

  @Post()
  @ApiOperation({ summary: 'Create or update email settings (SMTP / Resend)' })
  upsert(
    @Req() req: AuthenticatedRequest,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: UpsertEmailSettingsDto,
  ) {
    return this.settingsService.upsert(req.user?.sub, workspaceId, dto);
  }

  @Post('test')
  @ApiOperation({ summary: 'Send a test email using current settings' })
  test(
    @Req() req: AuthenticatedRequest,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: TestEmailDto,
  ) {
    return this.settingsService.sendTestEmail(req.user?.sub, workspaceId, dto.to);
  }
}

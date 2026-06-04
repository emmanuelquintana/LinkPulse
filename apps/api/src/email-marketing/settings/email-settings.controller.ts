import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
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
  get(@Req() req: Request & { user?: any }, @Query('workspaceId') workspaceId: string): Promise<any> {
    return this.settingsService.getSettings(req.user?.sub, workspaceId);
  }

  @Post()
  @ApiOperation({ summary: 'Create or update email settings (SMTP / Resend)' })
  upsert(
    @Req() req: Request & { user?: any },
    @Query('workspaceId') workspaceId: string,
    @Body() dto: UpsertEmailSettingsDto,
  ): Promise<any> {
    return this.settingsService.upsert(req.user?.sub, workspaceId, dto);
  }

  @Post('test')
  @ApiOperation({ summary: 'Send a test email using current settings' })
  test(
    @Req() req: Request & { user?: any },
    @Query('workspaceId') workspaceId: string,
    @Body() dto: TestEmailDto,
  ): Promise<any> {
    return this.settingsService.sendTestEmail(req.user?.sub, workspaceId, dto.to);
  }
}

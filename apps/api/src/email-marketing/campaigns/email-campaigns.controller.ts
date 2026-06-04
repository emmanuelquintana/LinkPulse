import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard.js';
import { EmailCampaignsService } from './email-campaigns.service.js';
import { CreateEmailCampaignDto } from '../dto/create-email-campaign.dto.js';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto.js';

@ApiTags('email-marketing / campaigns')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('email-campaigns')
export class EmailCampaignsController {
  constructor(private readonly campaignsService: EmailCampaignsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a draft email campaign' })
  create(@Req() req: Request & { user?: any }, @Body() dto: CreateEmailCampaignDto) {
    return this.campaignsService.create(req.user?.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List email campaigns for a workspace' })
  findAll(
    @Req() req: Request & { user?: any },
    @Query('workspaceId') workspaceId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.campaignsService.findAll(req.user?.sub, workspaceId, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific email campaign' })
  findOne(
    @Req() req: Request & { user?: any },
    @Query('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.campaignsService.findOne(req.user?.sub, workspaceId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a draft email campaign' })
  update(
    @Req() req: Request & { user?: any },
    @Query('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateEmailCampaignDto>,
  ) {
    return this.campaignsService.update(req.user?.sub, workspaceId, id, dto);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send an email campaign to all active subscribers' })
  send(
    @Req() req: Request & { user?: any },
    @Query('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.campaignsService.send(req.user?.sub, workspaceId, id);
  }
}

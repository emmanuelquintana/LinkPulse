import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.js';
import { CampaignsService } from './campaigns.service.js';
import { CreateCampaignDto } from './dto/create-campaign.dto.js';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard.js';

@ApiTags('campaigns')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  create(@Req() req: AuthenticatedRequest, @Body() createCampaignDto: CreateCampaignDto) {
    const userId = req.user?.sub;
    return this.campaignsService.create(userId, createCampaignDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all campaigns for a workspace' })
  findAll(@Req() req: AuthenticatedRequest, @Query('workspaceId') workspaceId: string) {
    const userId = req.user?.sub;
    return this.campaignsService.findAllForWorkspace(userId, workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific campaign by ID' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const userId = req.user?.sub;
    return this.campaignsService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific campaign' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateCampaignDto: Partial<CreateCampaignDto>,
  ) {
    const userId = req.user?.sub;
    return this.campaignsService.update(userId, id, updateCampaignDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific campaign' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const userId = req.user?.sub;
    return this.campaignsService.delete(userId, id);
  }
}

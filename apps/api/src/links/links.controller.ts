import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { LinksService } from './links.service.js';
import { CreateLinkDto } from './dto/create-link.dto.js';
import { LinkDto } from './dto/link.dto.js';
import { PaginationQueryDto } from '../shared/dto/pagination-query.dto.js';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard.js';
import { PlanLimitGuard } from '../billing/guards/plan-limit.guard.js';
import { ApiOkResponseWrapped } from '../shared/response/api-ok-response-wrapped.js';

@ApiTags('links')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  @UseGuards(PlanLimitGuard)
  @ApiOperation({ summary: 'Create a new shortened link' })
  @ApiOkResponseWrapped(LinkDto)
  create(@Req() req: Request & { user?: any }, @Body() createLinkDto: CreateLinkDto) {
    const userId = req.user?.sub;
    const email = req.user?.email;
    return this.linksService.create(userId, email, createLinkDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all links for the current user (paginated)' })
  // We don't have a specific paginated decorator yet, so we return the raw object for now
  findAll(@Req() req: Request & { user?: any }, @Query() paginationQuery: PaginationQueryDto) {
    const userId = req.user?.sub;
    return this.linksService.findAllForUser(userId, paginationQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific link by ID' })
  @ApiParam({ name: 'id', description: 'Link UUID' })
  @ApiOkResponseWrapped(LinkDto)
  findOne(@Req() req: Request & { user?: any }, @Param('id') id: string) {
    const userId = req.user?.sub;
    return this.linksService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a specific link' })
  @ApiParam({ name: 'id', description: 'Link UUID' })
  @ApiOkResponseWrapped(LinkDto)
  update(
    @Req() req: Request & { user?: any },
    @Param('id') id: string,
    @Body() updateLinkDto: Partial<CreateLinkDto>,
  ) {
    const userId = req.user?.sub;
    return this.linksService.partialUpdate(userId, id, updateLinkDto);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a specific link' })
  @ApiParam({ name: 'id', description: 'Link UUID' })
  @ApiOkResponseWrapped(LinkDto)
  archive(@Req() req: Request & { user?: any }, @Param('id') id: string) {
    const userId = req.user?.sub;
    return this.linksService.archive(userId, id);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiKeyGuard, type PublicApiRequest } from './api-key.guard.js';
import { PublicApiService } from './public-api.service.js';

class PublicCreateLinkDto {
  @IsUrl({ require_protocol: true })
  @IsNotEmpty()
  destination!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9-_]{3,64}$/, {
    message: 'alias must be 3-64 chars (letters, numbers, - or _)',
  })
  alias?: string;
}

/**
 * API pública para desarrolladores. Autenticación por API key (ApiKeyGuard),
 * completamente separada de la sesión Supabase del dashboard.
 */
@ApiTags('public-api')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('public')
export class PublicApiController {
  constructor(private readonly publicApi: PublicApiService) {}

  @Post('links')
  @ApiOperation({ summary: 'Create a short link (API key auth)' })
  createLink(@Req() req: PublicApiRequest, @Body() dto: PublicCreateLinkDto) {
    return this.publicApi.createLink(req.apiKey.workspaceId, req.apiKey.createdBy, dto);
  }

  @Get('links')
  @ApiOperation({ summary: 'List links of the workspace (paginated)' })
  listLinks(
    @Req() req: PublicApiRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.publicApi.listLinks(
      req.apiKey.workspaceId,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('links/:id')
  @ApiOperation({ summary: 'Get a link with its click count' })
  getLink(@Req() req: PublicApiRequest, @Param('id') id: string) {
    return this.publicApi.getLink(req.apiKey.workspaceId, id);
  }

  @Get('links/:id/stats')
  @ApiOperation({ summary: 'Get click analytics for a link' })
  getLinkStats(@Req() req: PublicApiRequest, @Param('id') id: string) {
    return this.publicApi.getLinkStats(req.apiKey.workspaceId, id);
  }
}

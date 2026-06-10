import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.js';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard.js';
import { ApiKeysService } from './api-keys.service.js';

class CreateApiKeyDto {
  @IsUUID()
  workspaceId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;
}

@ApiTags('api-keys')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'List active API keys for a workspace' })
  list(
    @Req() req: AuthenticatedRequest,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.apiKeysService.list(req.user?.sub, workspaceId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create an API key (the full key is returned only once)',
  })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateApiKeyDto) {
    return this.apiKeysService.create(req.user?.sub, dto.workspaceId, dto.name);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an API key' })
  revoke(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.apiKeysService.revoke(req.user?.sub, workspaceId, id);
  }
}

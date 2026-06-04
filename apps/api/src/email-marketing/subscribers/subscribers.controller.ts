import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard.js';
import { SubscribersService } from './subscribers.service.js';
import { CreateSubscriberDto } from '../dto/create-subscriber.dto.js';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto.js';

@ApiTags('email-marketing / subscribers')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('subscribers')
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a single subscriber' })
  create(@Req() req: Request & { user?: any }, @Body() dto: CreateSubscriberDto): Promise<any> {
    return this.subscribersService.create(req.user?.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List subscribers for a workspace (paginated)' })
  findAll(
    @Req() req: Request & { user?: any },
    @Query('workspaceId') workspaceId: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<any> {
    return this.subscribersService.findAll(req.user?.sub, workspaceId, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subscriber by ID' })
  findOne(
    @Req() req: Request & { user?: any },
    @Query('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ): Promise<any> {
    return this.subscribersService.findOne(req.user?.sub, workspaceId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subscriber' })
  update(
    @Req() req: Request & { user?: any },
    @Query('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateSubscriberDto>,
  ): Promise<any> {
    return this.subscribersService.update(req.user?.sub, workspaceId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a subscriber' })
  remove(
    @Req() req: Request & { user?: any },
    @Query('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.subscribersService.remove(req.user?.sub, workspaceId, id);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk import subscribers from CSV file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async bulkImport(
    @Req() req: Request & { user?: any },
    @Query('workspaceId') workspaceId: string,
    @UploadedFile() file: { buffer: Buffer; originalname: string },
  ) {
    const csvContent = file.buffer.toString('utf-8');
    return this.subscribersService.bulkImport(req.user?.sub, workspaceId, csvContent);
  }
}

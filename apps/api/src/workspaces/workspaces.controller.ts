import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { WorkspacesService } from './workspaces.service.js';
import { CreateWorkspaceDto } from './dto/create-workspace.dto.js';
import { WorkspaceDto } from './dto/workspace.dto.js';
import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto.js';
import { WorkspaceMemberDto } from './dto/workspace-member.dto.js';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard.js';
import { ApiOkResponseWrapped } from '../shared/response/api-ok-response-wrapped.js';
import { ApiOkResponseWrappedArray } from '../shared/response/api-ok-response-wrapped-array.decorator.js';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto.js';
import { Delete, Patch } from '@nestjs/common';

@ApiTags('workspaces')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiOkResponseWrapped(WorkspaceDto)
  createWorkspace(
    @Req() req: Request & { user?: any },
    @Body() dto: CreateWorkspaceDto,
  ) {
    const userId = req.user?.sub;
    const email = req.user?.email;
    return this.workspacesService.createWorkspace(userId, email, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all workspaces for the current user' })
  @ApiOkResponseWrappedArray(WorkspaceDto)
  getUserWorkspaces(@Req() req: Request & { user?: any }) {
    const userId = req.user?.sub;
    return this.workspacesService.getUserWorkspaces(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific workspace by ID' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiOkResponseWrapped(WorkspaceDto)
  getWorkspaceById(
    @Req() req: Request & { user?: any },
    @Param('id') workspaceId: string,
  ) {
    const userId = req.user?.sub;
    return this.workspacesService.getWorkspaceById(userId, workspaceId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a new member to the workspace' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiOkResponseWrapped(WorkspaceMemberDto)
  addWorkspaceMember(
    @Req() req: Request & { user?: any },
    @Param('id') workspaceId: string,
    @Body() dto: AddWorkspaceMemberDto,
  ) {
    const userId = req.user?.sub;
    return this.workspacesService.addMember(userId, workspaceId, dto.email, dto.role as 'ADMIN' | 'MEMBER');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace details' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiOkResponseWrapped(WorkspaceDto)
  updateWorkspace(
    @Req() req: Request & { user?: any },
    @Param('id') workspaceId: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    const userId = req.user?.sub;
    return this.workspacesService.updateWorkspace(userId, workspaceId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a workspace' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiOkResponseWrapped(WorkspaceDto)
  deleteWorkspace(
    @Req() req: Request & { user?: any },
    @Param('id') workspaceId: string,
  ) {
    const userId = req.user?.sub;
    return this.workspacesService.deleteWorkspace(userId, workspaceId);
  }
}

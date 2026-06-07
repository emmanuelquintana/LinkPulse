import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.js';
import { WorkspacesService } from './workspaces.service.js';
import { CreateWorkspaceDto } from './dto/create-workspace.dto.js';
import { WorkspaceDto } from './dto/workspace.dto.js';
import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto.js';
import { UpdateWorkspaceMemberDto } from './dto/update-workspace-member.dto.js';
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
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateWorkspaceDto,
  ) {
    const userId = req.user?.sub;
    const email = req.user?.email ?? '';
    return this.workspacesService.createWorkspace(userId, email, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all workspaces for the current user' })
  @ApiOkResponseWrappedArray(WorkspaceDto)
  getUserWorkspaces(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.sub;
    return this.workspacesService.getUserWorkspaces(userId);
  }

  @Get('me/permissions')
  @ApiOperation({ summary: 'Get effective permissions for the current user' })
  getMyPermissions(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.sub;
    return this.workspacesService.getEffectivePermissions(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific workspace by ID' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiOkResponseWrapped(WorkspaceDto)
  getWorkspaceById(
    @Req() req: AuthenticatedRequest,
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
    @Req() req: AuthenticatedRequest,
    @Param('id') workspaceId: string,
    @Body() dto: AddWorkspaceMemberDto,
  ) {
    const userId = req.user?.sub;
    return this.workspacesService.addMember(
      userId,
      workspaceId,
      dto.email,
      dto.role as 'ADMIN' | 'MEMBER',
      dto.permissions,
    );
  }

  @Patch(':id/members/:memberId')
  @ApiOperation({ summary: 'Update a member role or permissions' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiParam({ name: 'memberId', description: 'Membership UUID' })
  @ApiOkResponseWrapped(WorkspaceMemberDto)
  updateWorkspaceMember(
    @Req() req: AuthenticatedRequest,
    @Param('id') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateWorkspaceMemberDto,
  ) {
    const userId = req.user?.sub;
    return this.workspacesService.updateMember(userId, workspaceId, memberId, {
      role: dto.role as 'ADMIN' | 'MEMBER' | undefined,
      permissions: dto.permissions,
    });
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove a member from the workspace' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiParam({ name: 'memberId', description: 'Membership UUID' })
  removeWorkspaceMember(
    @Req() req: AuthenticatedRequest,
    @Param('id') workspaceId: string,
    @Param('memberId') memberId: string,
  ) {
    const userId = req.user?.sub;
    return this.workspacesService.removeMember(userId, workspaceId, memberId);
  }

  @Delete(':id/invitations/:invitationId')
  @ApiOperation({ summary: 'Revoke a pending invitation' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiParam({ name: 'invitationId', description: 'Invitation UUID' })
  revokeInvitation(
    @Req() req: AuthenticatedRequest,
    @Param('id') workspaceId: string,
    @Param('invitationId') invitationId: string,
  ) {
    const userId = req.user?.sub;
    return this.workspacesService.revokeInvitation(userId, workspaceId, invitationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace details' })
  @ApiParam({ name: 'id', description: 'Workspace UUID' })
  @ApiOkResponseWrapped(WorkspaceDto)
  updateWorkspace(
    @Req() req: AuthenticatedRequest,
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
    @Req() req: AuthenticatedRequest,
    @Param('id') workspaceId: string,
  ) {
    const userId = req.user?.sub;
    return this.workspacesService.deleteWorkspace(userId, workspaceId);
  }
}

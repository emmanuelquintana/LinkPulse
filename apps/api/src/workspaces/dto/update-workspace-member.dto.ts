import { ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceRole } from '@linkpulse/db';
import { IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkspacePermissionsDto } from './workspace-permissions.dto.js';

export class UpdateWorkspaceMemberDto {
  @ApiPropertyOptional({ enum: WorkspaceRole, description: 'New role to assign' })
  @IsOptional()
  @IsEnum(WorkspaceRole)
  role?: WorkspaceRole;

  @ApiPropertyOptional({
    type: () => WorkspacePermissionsDto,
    description: 'Overrides de permisos granulares (opcional)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkspacePermissionsDto)
  permissions?: WorkspacePermissionsDto;
}

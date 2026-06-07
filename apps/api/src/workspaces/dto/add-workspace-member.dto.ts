import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceRole } from '@linkpulse/db';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkspacePermissionsDto } from './workspace-permissions.dto.js';

export class AddWorkspaceMemberDto {
  @ApiProperty({ description: 'Email of the user to invite' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ enum: WorkspaceRole, description: 'Role to assign' })
  @IsEnum(WorkspaceRole)
  role!: WorkspaceRole;

  @ApiPropertyOptional({
    type: () => WorkspacePermissionsDto,
    description: 'Overrides de permisos granulares (opcional)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkspacePermissionsDto)
  permissions?: WorkspacePermissionsDto;
}

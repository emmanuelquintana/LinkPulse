import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceRole } from '@linkpulse/db';
import { ProfileDto } from '../../profiles/dto/profile.dto.js';

export class WorkspaceMemberDto {
  @ApiProperty({ description: 'The unique UUID of the membership record' })
  id!: string;

  @ApiProperty({ description: 'The ID of the workspace this member belongs to' })
  workspaceId!: string;

  @ApiProperty({ description: 'The user ID of the member' })
  userId!: string;

  @ApiProperty({ enum: WorkspaceRole, description: 'Role of the member in the workspace' })
  role!: WorkspaceRole;

  @ApiProperty({ description: 'When the member was added' })
  createdAt!: Date;

  @ApiProperty({ description: 'Crear, editar y archivar links' })
  canManageLinks!: boolean;

  @ApiProperty({ description: 'Gestionar email marketing y suscriptores' })
  canManageEmails!: boolean;

  @ApiProperty({ description: 'Ver analíticas y reportes' })
  canViewAnalytics!: boolean;

  @ApiProperty({ description: 'Invitar, editar y eliminar miembros' })
  canManageMembers!: boolean;

  @ApiProperty({ description: 'Gestionar el plan y la facturación' })
  canManageBilling!: boolean;

  @ApiPropertyOptional({ type: () => ProfileDto, description: 'Profile details of the member' })
  user?: ProfileDto;
}

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

  @ApiPropertyOptional({ type: () => ProfileDto, description: 'Profile details of the member' })
  user?: ProfileDto;
}

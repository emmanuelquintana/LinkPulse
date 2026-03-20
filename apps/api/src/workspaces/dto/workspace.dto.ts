import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspacePlan } from '@linkpulse/db';
import { ProfileDto } from '../../profiles/dto/profile.dto.js';

export class WorkspaceDto {
  @ApiProperty({ description: 'The unique UUID of the workspace' })
  id!: string;

  @ApiProperty({ description: 'Name of the workspace' })
  name!: string;

  @ApiProperty({ description: 'ID of the user who owns the workspace' })
  ownerUserId!: string;

  @ApiProperty({ enum: WorkspacePlan, description: 'The current billing plan of the workspace' })
  plan!: WorkspacePlan;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: () => ProfileDto, description: 'Owner profile details if requested' })
  owner?: ProfileDto;
}

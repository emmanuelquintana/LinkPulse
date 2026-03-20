import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LinkDto {
  @ApiProperty({ description: 'The unique UUID of the link' })
  id!: string;

  @ApiProperty({ description: 'The workspace ID this link belongs to (if any)' })
  workspaceId!: string | null;

  @ApiProperty({ description: 'The ID of the user who created the link' })
  userId!: string;

  @ApiProperty({ description: 'The original destination URL' })
  destination!: string;

  @ApiProperty({ description: 'The generated short code or custom alias' })
  shortCode!: string;

  @ApiPropertyOptional({ description: 'Optional title of the link' })
  title?: string | null;

  @ApiProperty({ description: 'Whether the link is archived' })
  isArchived!: boolean;

  @ApiProperty({ description: 'Total clicks received so far' })
  clicksCount!: number;

  @ApiProperty({ description: 'Optionally specifies when the link expires' })
  expiresAt?: Date | null;

  @ApiProperty({ description: 'When the link was created' })
  createdAt!: Date;

  @ApiProperty({ description: 'When the link was last updated' })
  updatedAt!: Date;
}

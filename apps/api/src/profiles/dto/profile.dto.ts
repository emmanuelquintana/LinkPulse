import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileDto {
  @ApiProperty({ description: 'The unique UUID of the profile (same as Supabase user ID)' })
  id!: string;

  @ApiProperty({ description: 'The email address of the user' })
  email!: string;

  @ApiPropertyOptional({ description: 'The first name of the user', nullable: true })
  firstName!: string | null;

  @ApiPropertyOptional({ description: 'The last name of the user', nullable: true })
  lastName!: string | null;

  @ApiPropertyOptional({ description: 'The avatar URL of the user', nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ description: 'When the profile was created' })
  createdAt!: Date;

  @ApiProperty({ description: 'When the profile was last updated' })
  updatedAt!: Date;
}

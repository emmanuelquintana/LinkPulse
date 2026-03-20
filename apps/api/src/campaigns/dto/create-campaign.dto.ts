import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCampaignDto {
  @ApiProperty({ description: 'The workspace ID this campaign belongs to' })
  @IsUUID()
  workspaceId!: string;

  @ApiProperty({ description: 'Name of the campaign', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Description of the campaign' })
  @IsString()
  @IsOptional()
  description?: string;
}

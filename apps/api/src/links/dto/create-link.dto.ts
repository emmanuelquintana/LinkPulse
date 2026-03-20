import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateLinkDto {
  @ApiProperty({ description: 'The destination URL to redirect to', example: 'https://example.com/very/long/path?ref=campaign' })
  @IsUrl({ require_tld: true, require_protocol: true })
  @IsNotEmpty()
  destination!: string;

  @ApiProperty({ description: 'ID of the workspace to assign this link to' })
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiPropertyOptional({ description: 'Optional campaign ID' })
  @IsUUID()
  @IsOptional()
  campaignId?: string;

  @ApiPropertyOptional({ description: 'Custom alias for the link (e.g., "my-promo")', example: 'my-promo' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Alias can only contain letters, numbers, hyphens, and underscores' })
  alias?: string;

  @ApiPropertyOptional({ description: 'Title or description for internal reference', example: 'Spring Promo Campaign' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  title?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEmailCampaignDto {
  @ApiProperty({ example: 'workspace-uuid' })
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty({ example: 'Our May Newsletter' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiPropertyOptional({ example: "Check what's new this month" })
  @IsOptional()
  @IsString()
  previewText?: string;

  @ApiProperty({ example: 'noreply@mycompany.com' })
  @IsEmail()
  senderEmail!: string;

  @ApiProperty({ example: 'My Company' })
  @IsString()
  @IsNotEmpty()
  senderName!: string;

  @ApiProperty({ example: '<h1>Hello!</h1><p>Click <a href="https://mysite.com">here</a></p>' })
  @IsString()
  @IsNotEmpty()
  htmlContent!: string;

  @ApiPropertyOptional({ example: ['manager@company.com'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @ApiPropertyOptional({ example: ['analytics@company.com'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[];

  @ApiPropertyOptional({ example: 'support@company.com' })
  @IsOptional()
  @IsEmail()
  replyTo?: string;
}

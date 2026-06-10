import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpsertEmailSettingsDto {
  @ApiProperty({ example: 'SMTP', enum: ['SMTP', 'RESEND'] })
  @IsIn(['SMTP', 'RESEND'])
  provider!: string;

  @ApiPropertyOptional({ example: 'smtp.hostinger.com' })
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiPropertyOptional({ example: 587 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number;

  @ApiPropertyOptional({ example: 'user@yourdomain.com' })
  @IsOptional()
  @IsString()
  smtpUser?: string;

  @ApiPropertyOptional({ example: 'yourpassword' })
  @IsOptional()
  @IsString()
  smtpPass?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;

  @ApiPropertyOptional({ example: 're_xxxxxxxx', description: 'Resend API key (per workspace)' })
  @IsOptional()
  @IsString()
  resendApiKey?: string;

  @ApiPropertyOptional({ example: 'noreply@yourdomain.com' })
  @IsOptional()
  @IsEmail()
  fromEmail?: string;

  @ApiPropertyOptional({ example: 'My Company' })
  @IsOptional()
  @IsString()
  fromName?: string;
}

export class TestEmailDto {
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  to!: string;
}

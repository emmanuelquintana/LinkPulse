import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Preferencias de notificación por categoría. Lo que no se envía conserva su
 * valor actual. Los avisos SYSTEM (p. ej. cambios de permisos) no se pueden
 * desactivar.
 */
export class UpdateNotificationPrefsDto {
  @ApiPropertyOptional({ description: 'Creación y archivado de enlaces' })
  @IsOptional()
  @IsBoolean()
  links?: boolean;

  @ApiPropertyOptional({ description: 'Campañas de enlaces y de correo' })
  @IsOptional()
  @IsBoolean()
  campaigns?: boolean;

  @ApiPropertyOptional({ description: 'Espacios de trabajo y miembros' })
  @IsOptional()
  @IsBoolean()
  team?: boolean;

  @ApiPropertyOptional({ description: 'Facturación y suscripciones' })
  @IsOptional()
  @IsBoolean()
  billing?: boolean;
}

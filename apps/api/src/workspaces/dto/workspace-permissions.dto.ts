import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Overrides de permisos granulares para un miembro. Todos opcionales: lo que no
 * se envíe conserva el valor por defecto del rol (al crear) o el actual (al
 * actualizar).
 */
export class WorkspacePermissionsDto {
  @ApiPropertyOptional({ description: 'Crear, editar y archivar links' })
  @IsOptional()
  @IsBoolean()
  canManageLinks?: boolean;

  @ApiPropertyOptional({ description: 'Gestionar email marketing y suscriptores' })
  @IsOptional()
  @IsBoolean()
  canManageEmails?: boolean;

  @ApiPropertyOptional({ description: 'Ver analíticas y reportes' })
  @IsOptional()
  @IsBoolean()
  canViewAnalytics?: boolean;

  @ApiPropertyOptional({ description: 'Invitar, editar y eliminar miembros' })
  @IsOptional()
  @IsBoolean()
  canManageMembers?: boolean;

  @ApiPropertyOptional({ description: 'Gestionar el plan y la facturación' })
  @IsOptional()
  @IsBoolean()
  canManageBilling?: boolean;
}

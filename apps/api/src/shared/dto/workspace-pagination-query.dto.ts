import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto.js';

/**
 * Paginación + `workspaceId`. Necesario porque el `ValidationPipe` global usa
 * `forbidNonWhitelisted`, así que el `workspaceId` debe estar declarado en el
 * DTO que valida la query (de lo contrario la petición se rechaza con 400).
 */
export class WorkspacePaginationQueryDto extends PaginationQueryDto {
  @ApiProperty({ description: 'Workspace ID to scope the results' })
  @IsUUID()
  workspaceId!: string;
}

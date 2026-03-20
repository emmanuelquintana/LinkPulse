import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceRole } from '@linkpulse/db';
import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';

export class AddWorkspaceMemberDto {
  @ApiProperty({ description: 'Email of the user to invite' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ enum: WorkspaceRole, description: 'Role to assign' })
  @IsEnum(WorkspaceRole)
  role!: WorkspaceRole;
}

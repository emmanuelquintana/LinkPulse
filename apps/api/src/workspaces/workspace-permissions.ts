/**
 * Permisos granulares por feature que un OWNER/ADMIN puede asignar a cada
 * miembro de un workspace. Las claves coinciden con las columnas booleanas del
 * modelo `WorkspaceMember` en Prisma.
 */
export const WORKSPACE_PERMISSIONS = [
  'canManageLinks',
  'canManageEmails',
  'canViewAnalytics',
  'canManageMembers',
  'canManageBilling',
] as const;

export type WorkspacePermission = (typeof WORKSPACE_PERMISSIONS)[number];

/** Permisos por defecto según el rol con el que se invita a un miembro. */
export function defaultPermissionsForRole(
  role: 'OWNER' | 'ADMIN' | 'MEMBER',
): Record<WorkspacePermission, boolean> {
  if (role === 'OWNER' || role === 'ADMIN') {
    return {
      canManageLinks: true,
      canManageEmails: true,
      canViewAnalytics: true,
      canManageMembers: true,
      canManageBilling: true,
    };
  }

  // MEMBER: acceso operativo básico, sin gestión de equipo ni facturación.
  return {
    canManageLinks: true,
    canManageEmails: false,
    canViewAnalytics: true,
    canManageMembers: false,
    canManageBilling: false,
  };
}

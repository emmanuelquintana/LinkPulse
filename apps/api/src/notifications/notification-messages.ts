import { NotificationType } from "@linkpulse/db";

/**
 * Builders de notificaciones: centralizan el `type`, el `href`, un texto de
 * respaldo (en español, idioma por defecto) y, sobre todo, la `metadata`
 * estructurada `{ key, params }`.
 *
 * El frontend usa `metadata.key` + `params` para renderizar el texto en el
 * idioma del usuario que la ve. El `title`/`body` guardados son solo fallback
 * (notificaciones antiguas o claves desconocidas).
 */

export interface BuiltNotification {
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  metadata: { key: string; params: Record<string, string> };
}

const build = (
  key: string,
  type: NotificationType,
  href: string,
  title: string,
  body: string,
  params: Record<string, string>,
): BuiltNotification => ({ type, href, title, body, metadata: { key, params } });

export const notif = {
  workspaceCreated: (name: string) =>
    build(
      "workspaceCreated",
      "WORKSPACE_CREATED",
      "/dashboard/workspaces",
      "Espacio de trabajo creado",
      `${name} está listo para enlaces y campañas.`,
      { name },
    ),

  memberAdded: (workspace: string, role: string) =>
    build(
      "memberAdded",
      "MEMBER_ADDED",
      "/dashboard/workspaces",
      "Te agregaron a un espacio",
      `Te agregaron a ${workspace} como ${role.toLowerCase()}.`,
      { workspace, role },
    ),

  permissionsChanged: (workspace: string) =>
    build(
      "permissionsChanged",
      "SYSTEM",
      "/dashboard",
      "Tus permisos cambiaron",
      `Se actualizaron tus permisos en ${workspace}. Recarga la página para aplicarlos.`,
      { workspace },
    ),

  linkCreatedSelf: (name: string) =>
    build(
      "linkCreatedSelf",
      "LINK_CREATED",
      "/dashboard/links",
      "Enlace creado",
      `${name} está listo para compartir.`,
      { name },
    ),

  linkCreatedWorkspace: (name: string) =>
    build(
      "linkCreatedWorkspace",
      "LINK_CREATED",
      "/dashboard/links",
      "Nuevo enlace en el espacio",
      `${name} fue creado.`,
      { name },
    ),

  linkArchived: (name: string) =>
    build(
      "linkArchived",
      "LINK_ARCHIVED",
      "/dashboard/links",
      "Enlace archivado",
      `${name} fue archivado.`,
      { name },
    ),

  campaignCreatedSelf: (name: string) =>
    build(
      "campaignCreatedSelf",
      "CAMPAIGN_CREATED",
      "/dashboard/campaigns",
      "Campaña creada",
      `${name} está lista para nuevos enlaces.`,
      { name },
    ),

  campaignCreatedWorkspace: (name: string) =>
    build(
      "campaignCreatedWorkspace",
      "CAMPAIGN_CREATED",
      "/dashboard/campaigns",
      "Nueva campaña en el espacio",
      `${name} está lista para nuevos enlaces.`,
      { name },
    ),
};

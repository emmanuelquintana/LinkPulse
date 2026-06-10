import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { Prisma } from "@linkpulse/db";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto.js";
import { ProfilesService } from "../profiles/profiles.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { notif } from "../notifications/notification-messages.js";
import { EmailSenderService } from "../email-marketing/campaigns/email-sender.service.js";
import { invitationEmailTemplate } from "../email-marketing/templates/email-templates.js";
import { WorkspaceAccessService } from "./workspace-access.service.js";
import {
  defaultPermissionsForRole,
  WORKSPACE_PERMISSIONS,
  type WorkspacePermission,
} from "./workspace-permissions.js";

type PermissionOverrides = Partial<Record<WorkspacePermission, boolean>>;

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
    private readonly notificationsService: NotificationsService,
    private readonly access: WorkspaceAccessService,
    private readonly emailSender: EmailSenderService,
  ) {}

  /** Filtra un objeto de overrides dejando sólo claves de permiso válidas. */
  private sanitizePermissions(overrides?: PermissionOverrides) {
    const clean: PermissionOverrides = {};
    if (!overrides) return clean;
    for (const key of WORKSPACE_PERMISSIONS) {
      if (typeof overrides[key] === "boolean") {
        clean[key] = overrides[key];
      }
    }
    return clean;
  }

  async createWorkspace(
    userId: string,
    email: string,
    createWorkspaceDto: CreateWorkspaceDto,
  ) {
    const { name } = createWorkspaceDto;

    // Ensure profile exists in our DB before creating workspace (foreign key constraint)
    await this.profilesService.bootstrapProfile(userId, email);

    // Límite por plan: FREE permite 1 workspace, PRO permite 2 y ENTERPRISE
    // (suscripción por empresa) permite workspaces ilimitados.
    const ownedWorkspaces = await this.prisma.workspace.findMany({
      where: { ownerUserId: userId },
      select: { plan: true },
    });
    const hasEnterprise = ownedWorkspaces.some((w) => w.plan === "ENTERPRISE");
    if (!hasEnterprise) {
      const hasPro = ownedWorkspaces.some((w) => w.plan === "PRO");
      const limit = hasPro ? 2 : 1;
      if (ownedWorkspaces.length >= limit) {
        // El código LP_WORKSPACE_LIMIT permite al frontend mostrar un mensaje
        // localizado; el message queda como fallback descriptivo.
        throw new ForbiddenException({
          code: "LP_WORKSPACE_LIMIT",
          message: hasPro
            ? "Workspace limit reached: the PRO plan allows 2 workspaces. Upgrade to the ENTERPRISE plan (one subscription per company) for unlimited workspaces."
            : "Workspace limit reached: the FREE plan allows 1 workspace. Upgrade to PRO for 2 workspaces, or to ENTERPRISE (one subscription per company) for unlimited workspaces.",
          data: { plan: hasPro ? "PRO" : "FREE", limit },
        });
      }
    }

    const workspace = await this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name,
          ownerUserId: userId,
          // Los workspaces nuevos de un dueño ENTERPRISE heredan el plan.
          ...(hasEnterprise ? { plan: "ENTERPRISE" as const } : {}),
          members: {
            create: {
              userId,
              role: "OWNER",
              ...defaultPermissionsForRole("OWNER"),
            },
          },
        },
        include: {
          owner: true,
        },
      });

      return workspace;
    });

    await this.notificationsService.createForUser({
      userId,
      workspaceId: workspace.id,
      ...notif.workspaceCreated(workspace.name),
    });

    return workspace;
  }

  async getUserWorkspaces(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        owner: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        subscription: {
          select: {
            status: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
          },
        },
        _count: {
          select: { members: true, links: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Permisos efectivos del usuario, agregados sobre TODAS sus membresías
   * (OR por permiso). Un OWNER en cualquier workspace obtiene todo. Sirve para
   * que el frontend muestre/oculte secciones del menú.
   */
  async getEffectivePermissions(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
    });

    const agg: Record<WorkspacePermission, boolean> = {
      canManageLinks: false,
      canManageEmails: false,
      canViewAnalytics: false,
      canManageMembers: false,
      canManageBilling: false,
    };
    let isOwnerAnywhere = false;

    for (const m of memberships) {
      if (m.role === "OWNER") {
        isOwnerAnywhere = true;
        for (const key of WORKSPACE_PERMISSIONS) agg[key] = true;
        continue;
      }
      for (const key of WORKSPACE_PERMISSIONS) {
        if (m[key]) agg[key] = true;
      }
    }

    return { ...agg, isOwnerAnywhere, workspaceCount: memberships.length };
  }

  async getWorkspaceById(userId: string, workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        owner: true,
        members: {
          include: {
            user: true,
          },
        },
        invitations: {
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${workspaceId} not found`);
    }

    const isMember = workspace.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException("You do not have access to this workspace");
    }

    return workspace;
  }

  async addMember(
    userId: string,
    workspaceId: string,
    email: string,
    role: "ADMIN" | "MEMBER",
    permissions?: PermissionOverrides,
  ) {
    // 1. El usuario actual necesita el permiso de gestionar miembros.
    await this.access.assertPermission(userId, workspaceId, "canManageMembers");
    const workspace = await this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
    });

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Permisos: defaults por rol, sobreescritos por los overrides explícitos.
    const resolvedPermissions = {
      ...defaultPermissionsForRole(role),
      ...this.sanitizePermissions(permissions),
    };

    // 3. ¿Ya tiene cuenta? Si existe el perfil, se añade como miembro al instante.
    const existingProfile = await this.prisma.profile.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingProfile) {
      try {
        const membership = await this.prisma.workspaceMember.create({
          data: {
            workspaceId,
            userId: existingProfile.id,
            role,
            ...resolvedPermissions,
          },
          include: { user: true },
        });

        await this.notificationsService.createForUser({
          userId: existingProfile.id,
          workspaceId,
          ...notif.memberAdded(workspace.name, role),
        });

        return { status: "added" as const, member: membership };
      } catch (error: unknown) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new ForbiddenException(
            "User is already a member of this workspace",
          );
        }
        throw error;
      }
    }

    // 4. No tiene cuenta: se crea (o actualiza) una invitación pendiente.
    const invitation = await this.prisma.workspaceInvitation.upsert({
      where: {
        workspaceId_email: { workspaceId, email: normalizedEmail },
      },
      create: {
        workspaceId,
        email: normalizedEmail,
        role,
        invitedById: userId,
        status: "PENDING",
        ...resolvedPermissions,
      },
      update: {
        role,
        invitedById: userId,
        status: "PENDING",
        acceptedAt: null,
        ...resolvedPermissions,
      },
    });

    // 5. Email de invitación (best-effort: no bloquea si el envío falla).
    const inviter = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    const inviterName = [inviter?.firstName, inviter?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    await this.sendInvitationEmail(
      invitation.email,
      workspace.name,
      inviterName || undefined,
    );

    return { status: "invited" as const, invitation };
  }

  private async sendInvitationEmail(
    email: string,
    workspaceName: string,
    inviterName?: string,
  ) {
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const registerUrl = `${appUrl.replace(/\/$/, "")}/register?email=${encodeURIComponent(email)}`;
    const fromEmail = process.env.MAIL_FROM_EMAIL ?? "no-reply@linkpulse.app";
    const fromName = process.env.MAIL_FROM_NAME ?? "LinkPulse";

    const { subject, html } = invitationEmailTemplate({
      workspaceName,
      inviteeEmail: email,
      registerUrl,
      inviterName,
    });

    try {
      await this.emailSender.send({ to: email, from: fromEmail, fromName, subject, html });
    } catch {
      // El envío es best-effort: la invitación queda creada y se acepta al registrarse.
    }
  }

  async revokeInvitation(
    userId: string,
    workspaceId: string,
    invitationId: string,
  ) {
    await this.access.assertPermission(userId, workspaceId, "canManageMembers");

    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { id: invitationId },
    });
    if (!invitation || invitation.workspaceId !== workspaceId) {
      throw new NotFoundException("Invitation not found in this workspace");
    }

    await this.prisma.workspaceInvitation.delete({ where: { id: invitationId } });
    return { id: invitationId, revoked: true };
  }

  async updateMember(
    userId: string,
    workspaceId: string,
    memberId: string,
    data: { role?: "ADMIN" | "MEMBER"; permissions?: PermissionOverrides },
  ) {
    await this.access.assertPermission(userId, workspaceId, "canManageMembers");

    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.workspaceId !== workspaceId) {
      throw new NotFoundException("Member not found in this workspace");
    }
    if (member.role === "OWNER") {
      throw new ForbiddenException("The workspace owner cannot be modified");
    }

    const updated = await this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: {
        ...(data.role ? { role: data.role } : {}),
        ...this.sanitizePermissions(data.permissions),
      },
      include: { user: true, workspace: { select: { name: true } } },
    });

    // Avisa al miembro afectado que sus permisos cambiaron (debe recargar).
    await this.notificationsService.createForUser({
      userId: updated.userId,
      workspaceId,
      ...notif.permissionsChanged(updated.workspace.name),
    });

    return updated;
  }

  async removeMember(userId: string, workspaceId: string, memberId: string) {
    await this.access.assertPermission(userId, workspaceId, "canManageMembers");

    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.workspaceId !== workspaceId) {
      throw new NotFoundException("Member not found in this workspace");
    }
    if (member.role === "OWNER") {
      throw new ForbiddenException("The workspace owner cannot be removed");
    }

    await this.prisma.workspaceMember.delete({ where: { id: memberId } });
    return { id: memberId, removed: true };
  }

  async updateWorkspace(
    userId: string,
    workspaceId: string,
    data: { name: string },
  ) {
    const workspace = await this.getWorkspaceById(userId, workspaceId);

    // Only OWNER can update workspace details
    const membership = workspace.members.find((m) => m.userId === userId);
    if (!membership || membership.role !== "OWNER") {
      throw new ForbiddenException(
        "Only the owner can update the workspace name",
      );
    }

    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: data.name },
    });
  }

  async deleteWorkspace(userId: string, workspaceId: string) {
    const workspace = await this.getWorkspaceById(userId, workspaceId);

    // Only OWNER can delete workspace
    const membership = workspace.members.find((m) => m.userId === userId);
    if (!membership || membership.role !== "OWNER") {
      throw new ForbiddenException("Only the owner can delete the workspace");
    }

    // This will cascade delete members and links due to Prisma schema
    return this.prisma.workspace.delete({
      where: { id: workspaceId },
    });
  }
}

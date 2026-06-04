import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto.js";
import { ProfilesService } from "../profiles/profiles.service.js";
import { NotificationsService } from "../notifications/notifications.service.js";

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createWorkspace(
    userId: string,
    email: string,
    createWorkspaceDto: CreateWorkspaceDto,
  ) {
    const { name } = createWorkspaceDto;

    // Ensure profile exists in our DB before creating workspace (foreign key constraint)
    await this.profilesService.bootstrapProfile(userId, email);

    const workspace = await this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name,
          ownerUserId: userId,
          members: {
            create: {
              userId,
              role: "OWNER",
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
      type: "WORKSPACE_CREATED",
      title: "Workspace created",
      body: `${workspace.name} is ready for links and campaigns.`,
      href: "/dashboard/workspaces",
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });
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
  ) {
    // 1. Verify the current user is OWNER or ADMIN
    const workspace = await this.getWorkspaceById(userId, workspaceId);

    const currentUserMembership = workspace.members.find(
      (m) => m.userId === userId,
    );
    if (
      !currentUserMembership ||
      (currentUserMembership.role !== "OWNER" &&
        currentUserMembership.role !== "ADMIN")
    ) {
      throw new ForbiddenException("Only owners and admins can add members");
    }

    // 2. Find the user being invited by email
    const userToAdd = await this.prisma.profile.findUnique({
      where: { email },
    });

    if (!userToAdd) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    // 3. Add the member
    try {
      const membership = await this.prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: userToAdd.id,
          role,
        },
        include: {
          user: true,
        },
      });

      await this.notificationsService.createForUser({
        userId: userToAdd.id,
        workspaceId,
        type: "MEMBER_ADDED",
        title: "Added to workspace",
        body: `You were added to ${workspace.name} as ${role.toLowerCase()}.`,
        href: "/dashboard/workspaces",
      });

      return membership;
    } catch (error: any) {
      if (error.code === "P2002") {
        // Unique constraint violation in Prisma
        throw new ForbiddenException(
          "User is already a member of this workspace",
        );
      }
      throw error;
    }
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

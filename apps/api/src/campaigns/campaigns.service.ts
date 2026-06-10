import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateCampaignDto } from "./dto/create-campaign.dto.js";
import { NotificationsService } from "../notifications/notifications.service.js";
import { notif } from "../notifications/notification-messages.js";

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, createCampaignDto: CreateCampaignDto) {
    const { workspaceId, name, description } = createCampaignDto;

    // Validate workspace membership
    const isMember = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
      },
    });

    if (!isMember) {
      throw new ForbiddenException("You do not have access to this workspace");
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        workspaceId,
        name,
        description,
      },
    });

    await this.notificationsService.createForUser({
      userId,
      workspaceId,
      ...notif.campaignCreatedSelf(campaign.name),
    });

    await this.notificationsService.createForWorkspaceMembers(
      workspaceId,
      notif.campaignCreatedWorkspace(campaign.name),
      [userId],
    );

    return campaign;
  }

  async findAllForWorkspace(userId: string, workspaceId: string) {
    // Validate workspace membership
    const isMember = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
      },
    });

    if (!isMember) {
      throw new ForbiddenException("You do not have access to this workspace");
    }

    return this.prisma.campaign.findMany({
      where: {
        workspaceId,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(userId: string, id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { workspace: true },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    // Validate membership
    const isMember = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId: campaign.workspaceId,
        userId,
      },
    });

    if (!isMember) {
      throw new ForbiddenException("You do not have access to this campaign");
    }

    return campaign;
  }

  async update(userId: string, id: string, data: Partial<CreateCampaignDto>) {
    await this.findOne(userId, id); // Validates access

    return this.prisma.campaign.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  async delete(userId: string, id: string) {
    await this.findOne(userId, id); // Validates access

    return this.prisma.campaign.delete({
      where: { id },
    });
  }
}

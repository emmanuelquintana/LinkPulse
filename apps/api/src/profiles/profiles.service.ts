import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SupabaseUserMetadata } from '../common/types/authenticated-request.js';

@Injectable()
export class ProfilesService {
    constructor(private readonly prisma: PrismaService) { }

    async getProfile(id: string) {
        return this.prisma.profile.findUnique({
            where: { id },
        });
    }

    async bootstrapProfile(userId: string, email: string, metadata?: SupabaseUserMetadata) {
        console.log(`[ProfilesService] Bootstrapping profile for ${userId} (${email})`, metadata ? 'with metadata' : 'without metadata');
        const existing = await this.getProfile(userId);
        
        // Extract metadata if available
        const metaFirstName = metadata?.first_name || (metadata?.full_name ? metadata.full_name.split(' ')[0] : undefined);
        const metaLastName = metadata?.last_name || (metadata?.full_name ? metadata.full_name.split(' ').slice(1).join(' ') : undefined);
        const metaAvatarUrl = metadata?.avatar_url || metadata?.picture;

        let profile;

        if (existing) {
            console.log(`[ProfilesService] Found existing profile for ${userId}`);

            // If existing profile is missing data but metadata has it, update it
            const needsUpdate = (!existing.firstName && metaFirstName) ||
                              (!existing.lastName && metaLastName) ||
                              (!existing.avatarUrl && metaAvatarUrl);

            if (needsUpdate) {
                console.log(`[ProfilesService] Updating existing profile with missing metadata`);
                profile = await this.prisma.profile.update({
                    where: { id: userId },
                    data: {
                        firstName: existing.firstName || metaFirstName,
                        lastName: existing.lastName || metaLastName,
                        avatarUrl: existing.avatarUrl || metaAvatarUrl,
                    }
                });
            } else {
                profile = existing;
            }
        } else {
            console.log(`[ProfilesService] Creating new profile for ${userId}`);
            profile = await this.prisma.profile.create({
                data: {
                    id: userId,
                    email,
                    firstName: metaFirstName,
                    lastName: metaLastName,
                    avatarUrl: metaAvatarUrl,
                },
            });
        }

        // Acepta automáticamente cualquier invitación pendiente para este email.
        await this.claimPendingInvitations(userId, email);

        return profile;
    }

    /**
     * Convierte las invitaciones PENDING que coincidan con el email del usuario
     * en membresías reales, copiando rol y permisos definidos por quien invitó.
     */
    private async claimPendingInvitations(userId: string, email: string) {
        const normalizedEmail = email.trim().toLowerCase();
        const invites = await this.prisma.workspaceInvitation.findMany({
            where: { email: normalizedEmail, status: 'PENDING' },
        });

        for (const inv of invites) {
            try {
                await this.prisma.workspaceMember.upsert({
                    where: {
                        workspaceId_userId: { workspaceId: inv.workspaceId, userId },
                    },
                    create: {
                        workspaceId: inv.workspaceId,
                        userId,
                        role: inv.role,
                        canManageLinks: inv.canManageLinks,
                        canManageEmails: inv.canManageEmails,
                        canViewAnalytics: inv.canViewAnalytics,
                        canManageMembers: inv.canManageMembers,
                        canManageBilling: inv.canManageBilling,
                    },
                    update: {},
                });

                await this.prisma.workspaceInvitation.update({
                    where: { id: inv.id },
                    data: { status: 'ACCEPTED', acceptedAt: new Date() },
                });
            } catch (err) {
                console.error(
                    `[ProfilesService] Failed to claim invitation ${inv.id}:`,
                    err instanceof Error ? err.message : err,
                );
            }
        }
    }

    async updateProfile(userId: string, data: Partial<{ firstName: string, lastName: string, avatarUrl: string }>) {
        console.log(`[ProfilesService] Updating profile for ${userId} with data:`, data);
        return this.prisma.profile.update({
            where: { id: userId },
            data,
        });
    }
}

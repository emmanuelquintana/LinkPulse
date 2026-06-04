import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProfilesService {
    constructor(private readonly prisma: PrismaService) { }

    async getProfile(id: string) {
        return this.prisma.profile.findUnique({
            where: { id },
        });
    }

    async bootstrapProfile(userId: string, email: string, metadata?: any) {
        console.log(`[ProfilesService] Bootstrapping profile for ${userId} (${email})`, metadata ? 'with metadata' : 'without metadata');
        const existing = await this.getProfile(userId);
        
        // Extract metadata if available
        const metaFirstName = metadata?.first_name || (metadata?.full_name ? metadata.full_name.split(' ')[0] : undefined);
        const metaLastName = metadata?.last_name || (metadata?.full_name ? metadata.full_name.split(' ').slice(1).join(' ') : undefined);
        const metaAvatarUrl = metadata?.avatar_url || metadata?.picture;

        if (existing) {
            console.log(`[ProfilesService] Found existing profile for ${userId}`);
            
            // If existing profile is missing data but metadata has it, update it
            const needsUpdate = (!existing.firstName && metaFirstName) || 
                              (!existing.lastName && metaLastName) || 
                              (!existing.avatarUrl && metaAvatarUrl);
            
            if (needsUpdate) {
                console.log(`[ProfilesService] Updating existing profile with missing metadata`);
                return this.prisma.profile.update({
                    where: { id: userId },
                    data: {
                        firstName: existing.firstName || metaFirstName,
                        lastName: existing.lastName || metaLastName,
                        avatarUrl: existing.avatarUrl || metaAvatarUrl,
                    }
                });
            }
            
            return existing;
        }

        console.log(`[ProfilesService] Creating new profile for ${userId}`);
        return this.prisma.profile.create({
            data: {
                id: userId,
                email,
                firstName: metaFirstName,
                lastName: metaLastName,
                avatarUrl: metaAvatarUrl,
            },
        });
    }

    async updateProfile(userId: string, data: Partial<{ firstName: string, lastName: string, avatarUrl: string }>) {
        console.log(`[ProfilesService] Updating profile for ${userId} with data:`, data);
        return this.prisma.profile.update({
            where: { id: userId },
            data,
        });
    }
}

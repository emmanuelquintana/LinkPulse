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

    async bootstrapProfile(userId: string, email: string) {
        console.log(`[ProfilesService] Bootstrapping profile for ${userId} (${email})`);
        const existing = await this.getProfile(userId);
        if (existing) {
            console.log(`[ProfilesService] Found existing profile for ${userId}:`, existing);
            return existing;
        }

        console.log(`[ProfilesService] Creating new profile for ${userId}`);
        return this.prisma.profile.create({
            data: {
                id: userId,
                email,
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

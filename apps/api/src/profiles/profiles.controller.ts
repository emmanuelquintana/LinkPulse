import { Controller, Get, Req, UseGuards, Patch, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.js';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard.js';
import { ApiOkResponseWrapped } from '../shared/response/api-ok-response-wrapped.js';
import { ProfileDto } from './dto/profile.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ProfilesService } from './profiles.service.js';

@ApiTags('Profiles')
@ApiBearerAuth()
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) { }

  @Get('bootstrap')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Bootstrap user profile', description: 'Creates or returns the user profile associated with the current Supabase token.' })
  @ApiOkResponseWrapped(ProfileDto)
  @ApiUnauthorizedResponse({ description: 'Invalid or missing Supabase token' })
  async bootstrapProfile(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.sub;
    const email = req.user?.email;
    const metadata = req.user?.user_metadata;

    if (!userId || !email) {
      return {
        ok: false,
        message: 'Invalid user data in token',
      };
    }

    const profile = await this.profilesService.bootstrapProfile(userId, email, metadata);
    return profile;
  }

  @Patch()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Update user profile' })
  @ApiOkResponseWrapped(ProfileDto)
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto
  ) {
    const userId = req.user?.sub;
    const profile = await this.profilesService.updateProfile(userId, updateProfileDto);
    return profile;
  }
}

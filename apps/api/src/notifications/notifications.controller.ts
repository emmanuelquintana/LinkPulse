import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import type { AuthenticatedRequest } from "../common/types/authenticated-request.js";
import { SupabaseAuthGuard } from "../common/guards/supabase-auth.guard.js";
import { ApiOkResponseWrapped } from "../shared/response/api-ok-response-wrapped.js";
import { NotificationDto } from "./dto/notification.dto.js";
import { NotificationQueryDto } from "./dto/notification-query.dto.js";
import { NotificationsService } from "./notifications.service.js";

@ApiTags("notifications")
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Get notifications for the current user" })
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: NotificationQueryDto,
  ) {
    const userId = req.user?.sub;
    return this.notificationsService.findAllForUser(userId, query);
  }

  @Get("unread-count")
  @ApiOperation({
    summary: "Get unread notification count for the current user",
  })
  getUnreadCount(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.sub;
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch("read-all")
  @ApiOperation({ summary: "Mark all notifications as read" })
  markAllAsRead(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.sub;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark one notification as read" })
  @ApiParam({ name: "id", description: "Notification UUID" })
  @ApiOkResponseWrapped(NotificationDto)
  markAsRead(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    const userId = req.user?.sub;
    return this.notificationsService.markAsRead(userId, id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete one notification" })
  @ApiParam({ name: "id", description: "Notification UUID" })
  delete(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    const userId = req.user?.sub;
    return this.notificationsService.deleteForUser(userId, id);
  }
}

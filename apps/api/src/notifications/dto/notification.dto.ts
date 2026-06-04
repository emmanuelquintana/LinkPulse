import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { NotificationType } from "@linkpulse/db";

export class NotificationDto {
  @ApiProperty({ description: "The unique UUID of the notification" })
  id!: string;

  @ApiProperty({ description: "The user ID that owns this notification" })
  userId!: string;

  @ApiPropertyOptional({
    description: "Optional workspace ID associated with this notification",
    nullable: true,
  })
  workspaceId!: string | null;

  @ApiProperty({
    enum: NotificationType,
    description: "The notification category",
  })
  type!: NotificationType;

  @ApiProperty({ description: "Short notification title" })
  title!: string;

  @ApiPropertyOptional({
    description: "Additional notification context",
    nullable: true,
  })
  body!: string | null;

  @ApiPropertyOptional({
    description: "Dashboard URL to open when the notification is clicked",
    nullable: true,
  })
  href!: string | null;

  @ApiPropertyOptional({
    description: "When the notification was marked as read",
    nullable: true,
  })
  readAt!: Date | null;

  @ApiProperty({ description: "When the notification was created" })
  createdAt!: Date;
}

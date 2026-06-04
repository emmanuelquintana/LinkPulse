export type LinkStatus = "ACTIVE" | "ARCHIVED" | "BLOCKED" | "EXPIRED";

export type NotificationType =
  | "LINK_CREATED"
  | "LINK_ARCHIVED"
  | "CAMPAIGN_CREATED"
  | "WORKSPACE_CREATED"
  | "MEMBER_ADDED"
  | "BILLING"
  | "SYSTEM";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
}

export interface RedirectLookupResult {
  id: string;
  originalUrl: string;
  status: LinkStatus;
  expiresAt: string | null;
}

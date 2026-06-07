-- Default new workspaces to the PRO plan
ALTER TABLE "workspaces" ALTER COLUMN "plan" SET DEFAULT 'PRO';

-- Backfill: every existing workspace starts on PRO
UPDATE "workspaces" SET "plan" = 'PRO' WHERE "plan" = 'FREE';

-- Granular per-feature permissions for workspace members
ALTER TABLE "workspace_members" ADD COLUMN "can_manage_links" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "workspace_members" ADD COLUMN "can_manage_emails" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "workspace_members" ADD COLUMN "can_view_analytics" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "workspace_members" ADD COLUMN "can_manage_members" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "workspace_members" ADD COLUMN "can_manage_billing" BOOLEAN NOT NULL DEFAULT false;

-- Owners and admins get full permissions by default
UPDATE "workspace_members"
SET "can_manage_links" = true,
    "can_manage_emails" = true,
    "can_view_analytics" = true,
    "can_manage_members" = true,
    "can_manage_billing" = true
WHERE "role" IN ('OWNER', 'ADMIN');

-- Per-user notification preferences (JSON: { links, campaigns, team, billing })
ALTER TABLE "profiles" ADD COLUMN "notification_prefs" JSONB;

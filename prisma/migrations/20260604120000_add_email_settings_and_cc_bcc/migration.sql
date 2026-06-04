-- Add CC, BCC, ReplyTo fields to email_campaigns
ALTER TABLE "email_campaigns" ADD COLUMN "cc" TEXT;
ALTER TABLE "email_campaigns" ADD COLUMN "bcc" TEXT;
ALTER TABLE "email_campaigns" ADD COLUMN "reply_to" TEXT;

-- CreateTable email_settings
CREATE TABLE "email_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'SMTP',
    "smtp_host" TEXT,
    "smtp_port" INTEGER DEFAULT 587,
    "smtp_user" TEXT,
    "smtp_pass" TEXT,
    "smtp_secure" BOOLEAN NOT NULL DEFAULT false,
    "from_email" TEXT,
    "from_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_settings_workspace_id_key" ON "email_settings"("workspace_id");

-- AddForeignKey
ALTER TABLE "email_settings" ADD CONSTRAINT "email_settings_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

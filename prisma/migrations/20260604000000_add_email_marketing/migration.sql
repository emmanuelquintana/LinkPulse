-- CreateTable
CREATE TABLE "email_subscribers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBSCRIBED',
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriber_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "subscriber_id" UUID NOT NULL,

    CONSTRAINT "subscriber_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "preview_text" TEXT,
    "sender_email" TEXT NOT NULL,
    "sender_name" TEXT NOT NULL,
    "html_content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "subscriber_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "bounce_reason" TEXT,
    "sent_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_opens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email_log_id" UUID NOT NULL,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_hash" VARCHAR(255),
    "user_agent" TEXT,
    "country" VARCHAR(80),
    "city" VARCHAR(120),
    "device_type" "DeviceType" NOT NULL DEFAULT 'UNKNOWN',
    "browser" VARCHAR(120),
    "os" VARCHAR(120),

    CONSTRAINT "email_opens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_clicks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email_log_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "clicked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_hash" VARCHAR(255),
    "user_agent" TEXT,
    "country" VARCHAR(80),
    "city" VARCHAR(120),
    "device_type" "DeviceType" NOT NULL DEFAULT 'UNKNOWN',
    "browser" VARCHAR(120),
    "os" VARCHAR(120),

    CONSTRAINT "email_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_subscribers_workspace_id_idx" ON "email_subscribers"("workspace_id");
CREATE UNIQUE INDEX "email_subscribers_workspace_id_email_key" ON "email_subscribers"("workspace_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "subscriber_tags_subscriber_id_name_key" ON "subscriber_tags"("subscriber_id", "name");

-- CreateIndex
CREATE INDEX "email_campaigns_workspace_id_idx" ON "email_campaigns"("workspace_id");

-- CreateIndex
CREATE INDEX "email_logs_campaign_id_idx" ON "email_logs"("campaign_id");
CREATE INDEX "email_logs_subscriber_id_idx" ON "email_logs"("subscriber_id");

-- CreateIndex
CREATE INDEX "email_opens_email_log_id_idx" ON "email_opens"("email_log_id");

-- CreateIndex
CREATE INDEX "email_clicks_email_log_id_idx" ON "email_clicks"("email_log_id");

-- AddForeignKey
ALTER TABLE "email_subscribers" ADD CONSTRAINT "email_subscribers_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriber_tags" ADD CONSTRAINT "subscriber_tags_subscriber_id_fkey"
    FOREIGN KEY ("subscriber_id") REFERENCES "email_subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_campaign_id_fkey"
    FOREIGN KEY ("campaign_id") REFERENCES "email_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_subscriber_id_fkey"
    FOREIGN KEY ("subscriber_id") REFERENCES "email_subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_opens" ADD CONSTRAINT "email_opens_email_log_id_fkey"
    FOREIGN KEY ("email_log_id") REFERENCES "email_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_clicks" ADD CONSTRAINT "email_clicks_email_log_id_fkey"
    FOREIGN KEY ("email_log_id") REFERENCES "email_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

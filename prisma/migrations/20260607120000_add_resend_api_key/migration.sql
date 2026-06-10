-- Per-workspace Resend API key for email settings
ALTER TABLE "email_settings" ADD COLUMN "resend_api_key" TEXT;

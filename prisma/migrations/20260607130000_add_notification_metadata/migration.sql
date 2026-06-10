-- Structured metadata (i18n key + params) so notifications can be localized
-- on the frontend according to the viewer's language.
ALTER TABLE "notifications" ADD COLUMN "metadata" JSONB;

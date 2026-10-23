-- The course a family pre-registered for, when the form was opened from a
-- course's "S'inscrire" button. Nullable: older entries and forms opened
-- without a course have none.
ALTER TABLE "preinscriptions" ADD COLUMN "courseSlug" TEXT;
ALTER TABLE "preinscriptions" ADD COLUMN "courseTitle" TEXT;

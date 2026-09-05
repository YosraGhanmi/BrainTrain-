-- Rename PlanType values (MONTHLY stays; SEASONAL -> QUARTERLY, COURSE -> YEARLY).
-- Safe unconditional cast: both payment_plans and pricing_rules are empty at
-- this point in the app's history (pricing_rules was manually cleared of its
-- placeholder rows before this migration; payment_plans has never been
-- written to by real enrollments yet).
ALTER TYPE "PlanType" RENAME TO "PlanType_old";
CREATE TYPE "PlanType" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');
ALTER TABLE "payment_plans" ALTER COLUMN "type" TYPE "PlanType" USING ("type"::text::"PlanType");
ALTER TABLE "pricing_rules" ALTER COLUMN "planType" TYPE "PlanType" USING ("planType"::text::"PlanType");
DROP TYPE "PlanType_old";

-- Replace the single "" = default sentinel with an ageGroupSlug column:
-- rows now set either ageGroupSlug (age group's default rate) or courseSlug
-- (course-specific override), never both.
ALTER TABLE "pricing_rules" ALTER COLUMN "courseSlug" DROP DEFAULT;
ALTER TABLE "pricing_rules" ALTER COLUMN "courseSlug" DROP NOT NULL;
ALTER TABLE "pricing_rules" ADD COLUMN "ageGroupSlug" TEXT;

DROP INDEX "pricing_rules_planType_courseSlug_key";
CREATE UNIQUE INDEX "pricing_rules_planType_ageGroupSlug_key" ON "pricing_rules"("planType", "ageGroupSlug");
CREATE UNIQUE INDEX "pricing_rules_planType_courseSlug_key" ON "pricing_rules"("planType", "courseSlug");

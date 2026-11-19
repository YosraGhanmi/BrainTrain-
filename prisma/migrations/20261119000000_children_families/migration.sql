-- Children page: optional date of birth, age group picked by hand, and a
-- shared family record (two parents, two phones each) for brothers and sisters.

CREATE TYPE "ParentRelation" AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN');

CREATE TABLE "families" (
    "id" TEXT NOT NULL,
    "parent1Name" TEXT,
    "parent1Relation" "ParentRelation",
    "parent1Phone" TEXT,
    "parent1Phone2" TEXT,
    "parent2Name" TEXT,
    "parent2Relation" "ParentRelation",
    "parent2Phone" TEXT,
    "parent2Phone2" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "children" ADD COLUMN "familyId" TEXT;
ALTER TABLE "children" ADD COLUMN "ageGroupManual" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "children" ALTER COLUMN "dateOfBirth" DROP NOT NULL;

-- Children imported from Firebase without a birth date were stored on
-- 1 January 1970
UPDATE "children" SET "dateOfBirth" = NULL WHERE "dateOfBirth" = DATE '1970-01-01';

-- Each child's paper-record contact becomes its own family's first parent
INSERT INTO "families" ("id", "parent1Name", "parent1Phone", "email", "createdAt", "updatedAt")
SELECT 'fam_' || "id", NULLIF(TRIM("contactName"), ''), NULLIF(TRIM("contactPhone"), ''), NULLIF(TRIM("contactEmail"), ''),
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "children"
WHERE COALESCE(NULLIF(TRIM("contactName"), ''), NULLIF(TRIM("contactPhone"), ''), NULLIF(TRIM("contactEmail"), '')) IS NOT NULL;

UPDATE "children" SET "familyId" = 'fam_' || "id"
WHERE EXISTS (SELECT 1 FROM "families" f WHERE f."id" = 'fam_' || "children"."id");

ALTER TABLE "children" DROP COLUMN "contactName";
ALTER TABLE "children" DROP COLUMN "contactPhone";
ALTER TABLE "children" DROP COLUMN "contactEmail";

CREATE INDEX "children_familyId_idx" ON "children"("familyId");

ALTER TABLE "children" ADD CONSTRAINT "children_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

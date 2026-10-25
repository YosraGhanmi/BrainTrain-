-- More details on the preinscription form: the child's school system
-- (optional), the parent's email (required on the form) and a second phone
-- number (optional). Nullable: entries sent before these existed have none.
ALTER TABLE "preinscriptions" ADD COLUMN "schoolSystem" TEXT;
ALTER TABLE "preinscriptions" ADD COLUMN "parentEmail" TEXT;
ALTER TABLE "preinscriptions" ADD COLUMN "parentPhone2" TEXT;

-- Sign-in hardening.

-- Attempt counters for sign-ins, one-time codes and the public forms.
CREATE TABLE "auth_attempts" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_attempts_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "auth_attempts_windowStart_idx" ON "auth_attempts"("windowStart");

-- The teacher secret code is kept as a bcrypt hash only from now on.
ALTER TABLE "users" DROP COLUMN "teacherSecretCode";

-- Teachers created with a password chosen by staff must pick their own.
-- Every existing teacher account is flagged: until now they all started with
-- the same default password.
ALTER TABLE "users" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
UPDATE "users" SET "mustChangePassword" = true WHERE "role" = 'TEACHER';

-- One-time codes used to be written to the SMS log in full.
UPDATE "sms_notifications"
SET "message" = regexp_replace("message", '[0-9]{6}', '******')
WHERE "purpose" = 'PASSWORD_RESET';

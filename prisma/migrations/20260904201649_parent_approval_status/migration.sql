-- CreateEnum
CREATE TYPE "ParentApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "parents" ADD COLUMN     "status" "ParentApprovalStatus" NOT NULL DEFAULT 'PENDING';

-- Approval review is a new gate — accounts that already existed before it
-- shouldn't retroactively get locked out of login.
UPDATE "parents" SET "status" = 'APPROVED';

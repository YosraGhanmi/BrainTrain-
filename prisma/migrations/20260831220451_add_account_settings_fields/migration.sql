-- AlterTable
ALTER TABLE "users" ADD COLUMN     "backupEmail" TEXT,
ADD COLUMN     "secondaryPhone" TEXT,
ADD COLUMN     "twoFactorCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN     "twoFactorCodeHash" TEXT,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "users_secondaryPhone_key" ON "users"("secondaryPhone");


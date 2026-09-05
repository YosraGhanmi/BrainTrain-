-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "courseSlug" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "teacherSecretCodeHash" TEXT;

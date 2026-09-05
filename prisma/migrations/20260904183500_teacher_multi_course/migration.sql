/*
  Warnings:

  - You are about to drop the column `courseSlug` on the `teachers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "teachers" DROP COLUMN "courseSlug",
ADD COLUMN     "courseSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[];

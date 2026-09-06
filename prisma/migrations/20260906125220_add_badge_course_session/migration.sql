-- AlterTable
ALTER TABLE "badges" ADD COLUMN     "courseSessionId" TEXT;

-- CreateIndex
CREATE INDEX "badges_courseSessionId_idx" ON "badges"("courseSessionId");

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_courseSessionId_fkey" FOREIGN KEY ("courseSessionId") REFERENCES "course_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

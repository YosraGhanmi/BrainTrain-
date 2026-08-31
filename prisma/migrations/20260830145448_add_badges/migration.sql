-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "emoji" TEXT NOT NULL DEFAULT '🏅',
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "badges_childId_idx" ON "badges"("childId");

-- CreateIndex
CREATE INDEX "badges_teacherId_idx" ON "badges"("teacherId");

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

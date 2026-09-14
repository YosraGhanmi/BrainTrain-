CREATE TABLE "preinscription_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "routeRegisterToForm" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preinscription_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "preinscriptions" (
    "id" TEXT NOT NULL,
    "childFullName" TEXT NOT NULL,
    "childAge" INTEGER NOT NULL,
    "institution" TEXT NOT NULL,
    "parentFullName" TEXT NOT NULL,
    "parentPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preinscriptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "preinscriptions_createdAt_idx" ON "preinscriptions"("createdAt");

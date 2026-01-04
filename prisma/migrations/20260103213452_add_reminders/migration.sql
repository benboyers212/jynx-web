-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "schedule" TEXT NOT NULL,
    "timeOfDay" TEXT,
    "daysOfWeek" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Reminder_userId_idx" ON "Reminder"("userId");

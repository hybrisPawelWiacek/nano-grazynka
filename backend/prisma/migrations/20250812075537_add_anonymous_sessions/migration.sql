-- CreateTable
CREATE TABLE "AnonymousSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VoiceNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "sessionId" TEXT,
    "title" TEXT NOT NULL,
    "originalFilePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "VoiceNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VoiceNote" ("createdAt", "errorMessage", "fileSize", "id", "language", "mimeType", "originalFilePath", "status", "tags", "title", "updatedAt", "userId", "version") SELECT "createdAt", "errorMessage", "fileSize", "id", "language", "mimeType", "originalFilePath", "status", "tags", "title", "updatedAt", "userId", "version" FROM "VoiceNote";
DROP TABLE "VoiceNote";
ALTER TABLE "new_VoiceNote" RENAME TO "VoiceNote";
CREATE INDEX "VoiceNote_userId_status_idx" ON "VoiceNote"("userId", "status");
CREATE INDEX "VoiceNote_userId_createdAt_idx" ON "VoiceNote"("userId", "createdAt");
CREATE INDEX "VoiceNote_userId_updatedAt_idx" ON "VoiceNote"("userId", "updatedAt");
CREATE INDEX "VoiceNote_sessionId_idx" ON "VoiceNote"("sessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousSession_sessionId_key" ON "AnonymousSession"("sessionId");

-- CreateIndex
CREATE INDEX "AnonymousSession_sessionId_idx" ON "AnonymousSession"("sessionId");

-- CreateIndex
CREATE INDEX "AnonymousSession_createdAt_idx" ON "AnonymousSession"("createdAt");

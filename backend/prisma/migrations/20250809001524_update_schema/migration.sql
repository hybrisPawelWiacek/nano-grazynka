-- CreateTable
CREATE TABLE "VoiceNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
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
    "version" INTEGER NOT NULL DEFAULT 1
);

-- CreateTable
CREATE TABLE "Transcription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voiceNoteId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "duration" REAL NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0.0,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transcription_voiceNoteId_fkey" FOREIGN KEY ("voiceNoteId") REFERENCES "VoiceNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Summary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voiceNoteId" TEXT NOT NULL,
    "transcriptionId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keyPoints" TEXT NOT NULL,
    "actionItems" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Summary_voiceNoteId_fkey" FOREIGN KEY ("voiceNoteId") REFERENCES "VoiceNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Summary_transcriptionId_fkey" FOREIGN KEY ("transcriptionId") REFERENCES "Transcription" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_aggregateId_fkey" FOREIGN KEY ("aggregateId") REFERENCES "VoiceNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "VoiceNote_userId_status_idx" ON "VoiceNote"("userId", "status");

-- CreateIndex
CREATE INDEX "VoiceNote_userId_createdAt_idx" ON "VoiceNote"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "VoiceNote_userId_updatedAt_idx" ON "VoiceNote"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Transcription_voiceNoteId_key" ON "Transcription"("voiceNoteId");

-- CreateIndex
CREATE INDEX "Transcription_voiceNoteId_idx" ON "Transcription"("voiceNoteId");

-- CreateIndex
CREATE UNIQUE INDEX "Summary_voiceNoteId_key" ON "Summary"("voiceNoteId");

-- CreateIndex
CREATE INDEX "Summary_voiceNoteId_idx" ON "Summary"("voiceNoteId");

-- CreateIndex
CREATE INDEX "Summary_transcriptionId_idx" ON "Summary"("transcriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_eventId_key" ON "Event"("eventId");

-- CreateIndex
CREATE INDEX "Event_aggregateId_idx" ON "Event"("aggregateId");

-- CreateIndex
CREATE INDEX "Event_occurredAt_idx" ON "Event"("occurredAt");

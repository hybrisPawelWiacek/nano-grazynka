-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transcription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voiceNoteId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "duration" REAL NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0.0,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transcription_voiceNoteId_fkey" FOREIGN KEY ("voiceNoteId") REFERENCES "VoiceNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Transcription" ("confidence", "duration", "id", "language", "text", "timestamp", "voiceNoteId") SELECT "confidence", "duration", "id", "language", "text", "timestamp", "voiceNoteId" FROM "Transcription";
DROP TABLE "Transcription";
ALTER TABLE "new_Transcription" RENAME TO "Transcription";
CREATE UNIQUE INDEX "Transcription_voiceNoteId_key" ON "Transcription"("voiceNoteId");
CREATE INDEX "Transcription_voiceNoteId_idx" ON "Transcription"("voiceNoteId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

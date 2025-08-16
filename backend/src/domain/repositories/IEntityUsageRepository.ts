export interface EntityUsageRecord {
  id?: string;
  entityId: string;
  voiceNoteId: string;
  projectId?: string;
  wasUsed: boolean;
  wasCorrected: boolean;
  originalText?: string;
  correctedText?: string;
  createdAt?: Date;
}

export interface IEntityUsageRepository {
  trackUsage(records: EntityUsageRecord[]): Promise<void>;
  findByVoiceNote(voiceNoteId: string): Promise<EntityUsageRecord[]>;
  findByEntity(entityId: string): Promise<EntityUsageRecord[]>;
  updateCorrection(
    usageId: string,
    wasCorrected: boolean,
    originalText?: string,
    correctedText?: string
  ): Promise<void>;
  getUsageStats(entityId: string): Promise<{
    totalUsage: number;
    correctUsage: number;
    correctionRate: number;
  }>;
}
import { PrismaClient } from '@prisma/client';
import { IEntityUsageRepository, EntityUsageRecord } from '../../domain/repositories/IEntityUsageRepository';

export class EntityUsageRepository implements IEntityUsageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async trackUsage(records: EntityUsageRecord[]): Promise<void> {
    if (records.length === 0) return;

    await this.prisma.entityUsage.createMany({
      data: records.map(record => ({
        entityId: record.entityId,
        voiceNoteId: record.voiceNoteId,
        projectId: record.projectId,
        wasUsed: record.wasUsed ?? false,
        wasCorrected: record.wasCorrected ?? false,
        originalText: record.originalText,
        correctedText: record.correctedText
      }))
    });
  }

  async findByVoiceNote(voiceNoteId: string): Promise<EntityUsageRecord[]> {
    const usages = await this.prisma.entityUsage.findMany({
      where: { voiceNoteId },
      include: {
        entity: true
      }
    });

    return usages.map(usage => ({
      id: usage.id,
      entityId: usage.entityId,
      voiceNoteId: usage.voiceNoteId,
      projectId: usage.projectId ?? undefined,
      wasUsed: usage.wasUsed,
      wasCorrected: usage.wasCorrected,
      originalText: usage.originalText ?? undefined,
      correctedText: usage.correctedText ?? undefined,
      createdAt: usage.createdAt
    }));
  }

  async findByEntity(entityId: string): Promise<EntityUsageRecord[]> {
    const usages = await this.prisma.entityUsage.findMany({
      where: { entityId },
      include: {
        voiceNote: true
      }
    });

    return usages.map(usage => ({
      id: usage.id,
      entityId: usage.entityId,
      voiceNoteId: usage.voiceNoteId,
      projectId: usage.projectId ?? undefined,
      wasUsed: usage.wasUsed,
      wasCorrected: usage.wasCorrected,
      originalText: usage.originalText ?? undefined,
      correctedText: usage.correctedText ?? undefined,
      createdAt: usage.createdAt
    }));
  }

  async updateCorrection(
    usageId: string,
    wasCorrected: boolean,
    originalText?: string,
    correctedText?: string
  ): Promise<void> {
    await this.prisma.entityUsage.update({
      where: { id: usageId },
      data: {
        wasCorrected,
        originalText,
        correctedText
      }
    });
  }

  async getUsageStats(entityId: string): Promise<{
    totalUsage: number;
    correctUsage: number;
    correctionRate: number;
  }> {
    const usages = await this.prisma.entityUsage.findMany({
      where: { entityId }
    });

    const totalUsage = usages.length;
    const correctUsage = usages.filter(u => u.wasUsed && !u.wasCorrected).length;
    const correctionRate = totalUsage > 0 
      ? (usages.filter(u => u.wasCorrected).length / totalUsage) * 100 
      : 0;

    return {
      totalUsage,
      correctUsage,
      correctionRate
    };
  }
}
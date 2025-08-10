import { VoiceNote } from '../entities/VoiceNote';
import { VoiceNoteId } from '../value-objects/VoiceNoteId';
import { ProcessingStatus } from '../value-objects/ProcessingStatus';
import { Language } from '../value-objects/Language';

export interface VoiceNoteFilter {
  userId?: string;
  status?: ProcessingStatus;
  language?: Language;
  tags?: string[];
  searchQuery?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: 'uploadedAt' | 'processedAt' | 'fileName' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface VoiceNoteRepository {
  save(voiceNote: VoiceNote): Promise<void>;
  findById(id: VoiceNoteId): Promise<VoiceNote | null>;
  findByFileHash(userId: string, fileHash: string): Promise<VoiceNote | null>;
  findByUserId(userId: string, pagination: PaginationOptions, filter?: VoiceNoteFilter): Promise<PaginatedResult<VoiceNote>>;
  findPendingForProcessing(limit: number): Promise<VoiceNote[]>;
  delete(id: VoiceNoteId): Promise<void>;
  exists(id: VoiceNoteId): Promise<boolean>;
}
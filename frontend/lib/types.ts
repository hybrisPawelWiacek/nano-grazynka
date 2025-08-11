// TypeScript types matching backend DTOs

export type Language = 'en' | 'pl';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ExportFormat = 'markdown' | 'json';

export interface VoiceNote {
  id: string;
  userId?: string;
  title: string;
  originalFilename: string;
  fileSize: number;
  duration?: number;
  language: Language;
  status: ProcessingStatus;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  tags: string[];
  transcriptions?: Transcription[];
  summaries?: Summary[];
  transcription?: Transcription;  // Singular for getById response
  summary?: Summary;              // Singular for getById response
}

export interface Transcription {
  id: string;
  voiceNoteId: string;
  text: string;
  language: Language;
  provider: string;
  model: string;
  createdAt: string;
}

export interface Summary {
  id: string;
  voiceNoteId: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  language: Language;
  provider: string;
  model: string;
  systemPrompt: string;
  userPrompt?: string;
  version: number;
  createdAt: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface FilterParams {
  userId?: string;
  status?: ProcessingStatus;
  language?: Language;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface UploadResponse {
  voiceNote: VoiceNote;
  message: string;
}

export interface ProcessingResponse {
  voiceNote: VoiceNote;
  transcription?: Transcription;
  summary?: Summary;
  message: string;
}

export interface ExportResponse {
  content: string;
  filename: string;
  format: ExportFormat;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  details?: any;
  traceId?: string;
}

export interface ReprocessRequest {
  systemPrompt?: string;
  userPrompt?: string;
}

export interface SearchParams extends PaginationParams, FilterParams {}
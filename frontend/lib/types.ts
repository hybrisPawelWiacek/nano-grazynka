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
  aiGeneratedTitle?: string;      // AI-generated 3-4 word title
  briefDescription?: string;      // AI-generated 10-15 word summary
  derivedDate?: string;           // Date extracted from content
  displayTitle?: string;          // Title to display (AI or original)
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
  cancelled?: boolean;
}

export interface ReprocessRequest {
  systemPrompt?: string;
  userPrompt?: string;
}

export interface SearchParams extends PaginationParams, FilterParams {}

// Project-related types
export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface ListProjectsResponse {
  projects: Project[];
  total: number;
}

// Entity-related types
export type EntityType = 'person' | 'company' | 'technical' | 'product';

export interface Entity {
  id: string;
  userId?: string;
  projectId?: string;
  name: string;
  type: EntityType;
  description?: string;
  context?: string;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectEntitiesResponse {
  entities: Entity[];
  total: number;
}
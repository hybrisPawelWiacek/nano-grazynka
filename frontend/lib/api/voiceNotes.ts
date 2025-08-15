// Voice Notes API operations

import { apiClient } from './client';
import type {
  VoiceNote,
  PaginatedResponse,
  SearchParams,
  UploadResponse,
  ProcessingResponse,
  ExportResponse,
  ExportFormat,
  ReprocessRequest,
} from '../types';

export const voiceNotesApi = {
  // List voice notes with search and filters
  async list(params?: SearchParams): Promise<PaginatedResponse<VoiceNote>> {
    return apiClient.get<PaginatedResponse<VoiceNote>>('/api/voice-notes', params);
  },

  // List voice notes with abort capability
  listWithAbort(params?: SearchParams): { promise: Promise<PaginatedResponse<VoiceNote>>; abort: () => void } {
    return apiClient.getWithAbort<PaginatedResponse<VoiceNote>>('/api/voice-notes', params);
  },

  // Get single voice note by ID
  async getById(id: string): Promise<VoiceNote> {
    return apiClient.get<VoiceNote>(`/api/voice-notes/${id}?includeTranscription=true&includeSummary=true`);
  },

  // Upload new voice note with optional custom prompt
  async upload(file: File, customPrompt?: string, metadata?: { title?: string; description?: string; tags?: string[] }): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Authentication is now handled by the backend via cookies
    // No need to send userId - the backend will use the authenticated user's ID
    
    // Add custom prompt if provided
    if (customPrompt) {
      formData.append('customPrompt', customPrompt);
    }
    
    if (metadata?.title) formData.append('title', metadata.title);
    if (metadata?.description) formData.append('description', metadata.description);
    if (metadata?.tags) formData.append('tags', metadata.tags.join(','));
    
    return apiClient.postFormData<UploadResponse>('/api/voice-notes', formData);
  },

  // Process uploaded voice note
  async process(id: string): Promise<ProcessingResponse> {
    return apiClient.post<ProcessingResponse>(`/api/voice-notes/${id}/process`, {});
  },

  // Reprocess voice note with new prompts
  async reprocess(id: string, request?: ReprocessRequest): Promise<ProcessingResponse> {
    return apiClient.post<ProcessingResponse>(`/api/voice-notes/${id}/reprocess`, request);
  },

  // Regenerate summary for a voice note
  async regenerateSummary(id: string, summaryPrompt?: string): Promise<VoiceNote> {
    return apiClient.post<VoiceNote>(`/api/voice-notes/${id}/regenerate-summary`, {
      summaryPrompt
    });
  },

  // Delete voice note
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/voice-notes/${id}`);
  },

  // Export voice note
  async export(id: string, format: ExportFormat = 'markdown'): Promise<Blob> {
    const response = await fetch(`${apiClient.baseUrl}/api/voice-notes/${id}/export?format=${format}`, {
      method: 'GET',
      headers: {
        'Accept': format === 'json' ? 'application/json' : 'text/markdown',
      },
      credentials: 'include', // Send cookies for authentication
    });
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }
    
    return response.blob();
  },

  // Poll for processing status
  async pollStatus(id: string, onUpdate?: (note: VoiceNote) => void): Promise<VoiceNote> {
    const maxAttempts = 150; // 5 minutes with 2-second intervals
    let attempts = 0;

    const poll = async (): Promise<VoiceNote> => {
      const note = await this.getById(id);
      
      if (onUpdate) {
        onUpdate(note);
      }

      if (note.status === 'completed' || note.status === 'failed') {
        return note;
      }

      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error('Processing timeout - please check the status later');
      }

      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
      return poll();
    };

    return poll();
  },

  // Helper to check if file is valid
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 500 * 1024 * 1024; // 500MB
    const allowedTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/mp4',
      'audio/x-m4a',
      'audio/ogg',
      'audio/webm',
      'video/mp4',
      'video/webm',
    ];

    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `File size exceeds 500MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)` 
      };
    }

    if (!allowedTypes.includes(file.type)) {
      // Check file extension as fallback
      const ext = file.name.toLowerCase().split('.').pop();
      const allowedExts = ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'mp4', 'mpeg', 'mpga'];
      
      if (!ext || !allowedExts.includes(ext)) {
        return { 
          valid: false, 
          error: `Invalid file type. Allowed formats: ${allowedExts.join(', ')}` 
        };
      }
    }

    return { valid: true };
  },

  // Helper to format file size
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  },

  // Helper to format duration
  formatDuration(seconds?: number): string {
    if (!seconds) return '';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  },
};
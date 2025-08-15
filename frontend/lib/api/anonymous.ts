import { apiClient } from './client';

export interface MigrationResult {
  migrated: number;
  message: string;
}

export interface UsageInfo {
  sessionId: string;
  usageCount: number;
  limit: number;
  remaining: number;
  createdAt: string;
  lastUsedAt: string;
}

/**
 * Migrate anonymous session notes to a user account
 * @param sessionId The anonymous session ID
 * @param userId The user ID to migrate notes to
 * @returns Migration result with count of migrated notes
 */
export async function migrateAnonymousSession(
  sessionId: string,
  userId: string
): Promise<MigrationResult> {
  const response = await apiClient.post<MigrationResult>('/api/anonymous/migrate', {
    sessionId,
    userId
  });
  
  return response;
}

/**
 * Get usage information for an anonymous session
 * @param sessionId The anonymous session ID
 * @returns Usage information including count and limits
 */
export async function getAnonymousUsage(sessionId: string): Promise<UsageInfo> {
  const response = await apiClient.get<UsageInfo>(`/api/anonymous/usage/${sessionId}`);
  return response;
}

/**
 * Get voice notes for an anonymous session
 * @param sessionId The anonymous session ID
 * @param options Query options for pagination
 * @returns List of voice notes for the session
 */
export async function getAnonymousVoiceNotes(
  sessionId: string,
  options: {
    page?: number;
    limit?: number;
    includeTranscription?: boolean;
    includeSummary?: boolean;
  } = {}
) {
  const params = new URLSearchParams();
  if (options.page) params.append('page', options.page.toString());
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.includeTranscription) params.append('includeTranscription', 'true');
  if (options.includeSummary) params.append('includeSummary', 'true');
  
  const response = await apiClient.get(`/api/anonymous/voice-notes/${sessionId}?${params.toString()}`);
  return response;
}
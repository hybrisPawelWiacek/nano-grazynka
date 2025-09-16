// API helper functions for the frontend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101';

/**
 * Utility function to retry failed requests with exponential backoff
 * @param fn The async function to retry
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @param delay Initial delay in milliseconds (default: 1000)
 * @returns Promise with the function result
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      // If it's the last retry, throw the error
      if (i === maxRetries - 1) throw error;
      
      // Check if error is retryable (network errors, 5xx server errors)
      const isRetryable = 
        error instanceof TypeError || // Network errors
        (error instanceof Error && error.message.includes('fetch')) ||
        (error instanceof Response && error.status >= 500);
      
      if (!isRetryable) throw error;
      
      // Wait with exponential backoff
      const waitTime = delay * Math.pow(2, i);
      console.log(`Request failed, retrying in ${waitTime}ms... (attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  throw new Error('Should not reach here');
}

/**
 * Regenerate the summary for a voice note with an optional custom prompt
 * @param noteId The ID of the voice note
 * @param userPrompt Optional custom prompt for the summary
 * @param sessionId Optional session ID for anonymous users
 * @returns Promise with the API response
 */
export async function regenerateSummary(
  noteId: string,
  userPrompt?: string,
  sessionId?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // Add session ID header for anonymous users
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }
    
    // Use retry logic for the regenerate request
    const regenerateWithRetry = async () => {
      const response = await fetch(`${API_URL}/api/voice-notes/${noteId}/regenerate-summary`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          userPrompt: userPrompt || undefined
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Throw error to trigger retry for server errors
        if (response.status >= 500) {
          throw new Error(data.message || `Server error: ${response.status}`);
        }
        // Don't retry client errors (4xx)
        return {
          success: false,
          error: data.message || 'Failed to regenerate summary'
        };
      }
      
      return {
        success: true,
        message: data.message || 'Summary regenerated successfully'
      };
    };
    
    // Execute with retry logic
    return await retryWithBackoff(regenerateWithRetry, 3, 1000);
  } catch (error: any) {
    console.error('Error regenerating summary:', error);
    return {
      success: false,
      error: error.message || 'Failed to regenerate summary'
    };
  }
}

/**
 * Upload a voice note file
 * @param file The audio file to upload
 * @param language Optional language code
 * @param whisperPrompt Optional Whisper prompt
 * @param sessionId Optional session ID for anonymous users
 * @returns Promise with the uploaded voice note data
 */
export async function uploadVoiceNote(
  file: File,
  language?: string,
  whisperPrompt?: string,
  sessionId?: string,
  transcriptionModel?: string,
  geminiSystemPrompt?: string,
  geminiUserPrompt?: string
): Promise<{
  success: boolean;
  data?: { id: string };
  error?: string;
}> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    if (language && language !== 'AUTO') {
      formData.append('language', language);
    }
    
    if (whisperPrompt) {
      formData.append('whisperPrompt', whisperPrompt);
    }
    
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }
    
    // Add new multi-model fields
    if (transcriptionModel) {
      formData.append('transcriptionModel', transcriptionModel);
    }
    
    if (geminiSystemPrompt) {
      formData.append('geminiSystemPrompt', geminiSystemPrompt);
    }
    
    if (geminiUserPrompt) {
      formData.append('geminiUserPrompt', geminiUserPrompt);
    }
    
    // Add headers for anonymous session
    const headers: HeadersInit = {};
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }
    
    // Use retry logic for the upload
    const uploadWithRetry = async () => {
      const response = await fetch(`${API_URL}/api/voice-notes`, {
        method: 'POST',
        credentials: 'include',
        headers,  // Include the headers with x-session-id
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Throw error to trigger retry for server errors
        if (response.status >= 500) {
          throw new Error(data.message || `Server error: ${response.status}`);
        }
        // Don't retry client errors (4xx)
        return {
          success: false,
          error: data.message || 'Upload failed'
        };
      }
      
      return {
        success: true,
        data: { id: data.voiceNote.id }
      };
    };
    
    // Execute with retry logic
    return await retryWithBackoff(uploadWithRetry, 3, 1000);
  } catch (error: any) {
    console.error('Error uploading voice note:', error);
    return {
      success: false,
      error: error.message || 'Upload failed'
    };
  }
}
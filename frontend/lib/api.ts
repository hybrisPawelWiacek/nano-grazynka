// API helper functions for the frontend

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
    
    const response = await fetch(`http://localhost:3101/api/voice-notes/${noteId}/regenerate-summary`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        userPrompt: userPrompt || undefined
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Failed to regenerate summary'
      };
    }
    
    return {
      success: true,
      message: data.message || 'Summary regenerated successfully'
    };
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
    
    const response = await fetch('http://localhost:3101/api/voice-notes', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Upload failed'
      };
    }
    
    return {
      success: true,
      data: { id: data.voiceNote.id }
    };
  } catch (error: any) {
    console.error('Error uploading voice note:', error);
    return {
      success: false,
      error: error.message || 'Upload failed'
    };
  }
}
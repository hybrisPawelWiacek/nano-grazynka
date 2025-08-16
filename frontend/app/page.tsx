'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConversionModal from '@/components/ConversionModal';
import AdvancedOptions from '@/components/AdvancedOptions';
import ProjectSelector from '@/components/ProjectSelector';
import EntityPills from '@/components/EntityPills';
import { getOrCreateSessionId, getUsageCount, getRemainingUsage } from '@/lib/anonymousSession';
import { toast } from 'sonner';
import { formatErrorForDisplay, formatErrorForToast } from '@/lib/error-messages';
import Header from '@/components/Header';
import styles from './page.module.css';

interface ProcessingStatus {
  stage: 'idle' | 'uploading' | 'processing' | 'transcribing' | 'summarizing' | 'complete' | 'error';
  progress: number;
  message: string;
  result?: {
    id: string;
    transcription?: string;
    summary?: string;
  };
}

// Template system for Gemini
const PROMPT_TEMPLATES = {
  meeting: {
    name: "Meeting Transcription",
    systemPrompt: "You are a professional meeting transcriber. Focus on accuracy, speaker identification, and action items.",
    userTemplate: `=== MEETING CONTEXT ===
Date: {date}
Attendees: {attendees}
Agenda: {agenda}

=== COMPANY GLOSSARY ===
Company: {company}
Projects: {projects}
Technical terms: {terms}

=== TRANSCRIPTION INSTRUCTIONS ===
1. Include timestamps every 30 seconds
2. Label speakers clearly [Name]:
3. Mark action items with [ACTION]
4. Mark decisions with [DECISION]
5. Note unclear audio with [UNCLEAR]
6. Preserve technical discussions verbatim

=== SPECIAL INSTRUCTIONS ===
{customInstructions}`
  },
  
  technical: {
    name: "Technical Discussion",
    systemPrompt: "You are a technical transcription specialist with expertise in software development.",
    userTemplate: `=== TECHNICAL CONTEXT ===
Domain: {domain}
Technologies: {technologies}
Codebase: {codebase}

=== TERMINOLOGY ===
Frameworks: {frameworks}
Libraries: {libraries}
Common variables: {variables}

=== INSTRUCTIONS ===
1. Preserve code snippets exactly
2. Maintain technical accuracy
3. Include API names and endpoints
4. Note architecture decisions
5. Flag ambiguous technical terms`
  },
  
  podcast: {
    name: "Podcast/Interview",
    systemPrompt: "You are transcribing a podcast or interview. Maintain conversational tone.",
    userTemplate: `=== SHOW INFORMATION ===
Show: {showName}
Host(s): {hosts}
Guest(s): {guests}
Topic: {topic}

=== STYLE GUIDE ===
- Include [LAUGHTER], [PAUSE], [CROSSTALK]
- Add chapter markers for topic changes
- Clean up filler words unless significant
- Preserve personality and tone`
  }
};

function getTemplatePrompts(templateName: string) {
  const template = PROMPT_TEMPLATES[templateName as keyof typeof PROMPT_TEMPLATES];
  if (!template) return null;
  return {
    systemPrompt: template.systemPrompt,
    userTemplate: template.userTemplate
  };
}

// Retry utility for network requests with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Only retry on network or server errors
      const isRetryable = 
        error instanceof TypeError ||
        (error instanceof Error && error.message.includes('fetch')) ||
        (error instanceof Response && error.status >= 500);
      
      if (!isRetryable) throw error;
      
      const waitTime = delay * Math.pow(2, i);
      console.log(`Request failed, retrying in ${waitTime}ms... (attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  throw new Error('Max retries exceeded');
}

export default function HomePage() {
  const { user, logout, isAnonymous, anonymousUsageCount, anonymousSessionId, refreshAnonymousUsage } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [whisperPrompt, setWhisperPrompt] = useState('');
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Multi-model transcription state with localStorage persistence
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const savedModel = localStorage.getItem('selectedTranscriptionModel');
      if (savedModel === 'gpt-4o-transcribe' || savedModel === 'google/gemini-2.0-flash-001') {
        return savedModel;
      }
    }
    return 'google/gemini-2.0-flash-001'; // Gemini as default
  });
  const [geminiPrompt, setGeminiPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>();
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: 'idle',
    progress: 0,
    message: ''
  });

  // Save selected model to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedTranscriptionModel', selectedModel);
    }
  }, [selectedModel]);

  // Check usage limits
  useEffect(() => {
    if (user) {
      // Check remaining credits for authenticated users
      const creditsRemaining = (user.creditLimit || 5) - (user.creditsUsed || 0);
      if (creditsRemaining <= 0 && status.stage === 'idle') {
        setStatus({
          stage: 'error',
          progress: 0,
          message: `You've used all ${user.creditLimit} transcriptions this month. Upgrade your plan for more.`
        });
      }
    } else if (isAnonymous && anonymousUsageCount >= 5 && status.stage === 'idle') {
      // Check anonymous usage limit
      const { title, message } = formatErrorForDisplay({ message: 'usage limit' });
      setStatus({
        stage: 'error',
        progress: 0,
        message
      });
    }
  }, [user, isAnonymous, anonymousUsageCount]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg'];
      if (!allowedTypes.includes(selectedFile.type)) {
        const { title, message } = formatErrorForDisplay({ message: 'unsupported format' });
        setStatus({
          stage: 'error',
          progress: 0,
          message
        });
        toast.error(formatErrorForToast({ message: 'unsupported format' }));
        return;
      }
      
      // Validate file size (100MB limit)
      if (selectedFile.size > 100 * 1024 * 1024) {
        const { title, message } = formatErrorForDisplay({ message: 'file too large' });
        setStatus({
          stage: 'error',
          progress: 0,
          message
        });
        toast.error(formatErrorForToast({ message: 'file too large' }));
        return;
      }
      
      setFile(selectedFile);
      setStatus({ stage: 'idle', progress: 0, message: '' });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    // Check if anonymous user has reached limit
    if (isAnonymous && anonymousUsageCount >= 5) {
      setShowConversionModal(true);
      return;
    }
    
    // Ensure we have a session ID for anonymous users
    const sessionId = isAnonymous ? (anonymousSessionId || getOrCreateSessionId()) : null;

    // Start upload process
    setStatus({ stage: 'uploading', progress: 20, message: 'Uploading voice note...' });

    const formData = new FormData();
    formData.append('file', file);
    // Always use auto-detect for language
    
    // Add multi-model transcription fields
    formData.append('transcriptionModel', selectedModel);
    
    if (selectedModel === 'gpt-4o-transcribe') {
      // For GPT-4o, use whisperPrompt
      if (whisperPrompt) {
        formData.append('whisperPrompt', whisperPrompt);
      }
    } else if (selectedModel === 'google/gemini-2.0-flash-001') {
      // For Gemini, use extended prompts
      if (geminiPrompt) {
        // Parse template if one is selected
        const template = selectedTemplate ? getTemplatePrompts(selectedTemplate) : null;
        if (template) {
          formData.append('geminiSystemPrompt', template.systemPrompt);
          formData.append('geminiUserPrompt', geminiPrompt);
        } else {
          // Use default system prompt with user's custom prompt
          const defaultSystemPrompt = 'You are a professional transcriber. Transcribe the audio accurately.';
          formData.append('geminiSystemPrompt', defaultSystemPrompt);
          formData.append('geminiUserPrompt', geminiPrompt);
        }
      }
    }
    
    // Add sessionId for anonymous users
    if (isAnonymous && sessionId) {
      formData.append('sessionId', sessionId);
    }
    
    // Add projectId if selected
    if (selectedProjectId) {
      formData.append('projectId', selectedProjectId);
    }

    try {
      // Upload file
      const uploadHeaders: Record<string, string> = {};
      
      // Add x-session-id header for anonymous users
      if (isAnonymous && sessionId) {
        uploadHeaders['x-session-id'] = sessionId;
      }
      
      const uploadResponse = await fetch('http://localhost:3101/api/voice-notes', {
        method: 'POST',
        credentials: 'include',
        headers: uploadHeaders,
        body: formData
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.message || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();
      const voiceNoteId = uploadData.voiceNote.id;

      // Update anonymous usage count immediately after successful upload
      // The backend increments the count, so we just fetch the updated value
      if (isAnonymous) {
        await refreshAnonymousUsage();  // Fetch updated count from backend
      }

      // Update status - processing
      setStatus({ stage: 'processing', progress: 40, message: 'Processing audio file...' });
      
      // Start processing
      const processHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add x-session-id header for anonymous users
      if (isAnonymous && sessionId) {
        processHeaders['x-session-id'] = sessionId;
      }
      
      // Process with retry logic
      const processResponse = await retryWithBackoff(async () => {
        const response = await fetch(`http://localhost:3101/api/voice-notes/${voiceNoteId}/process`, {
          method: 'POST',
          credentials: 'include',
          headers: processHeaders,
          body: JSON.stringify({}) // Always auto-detect language
        });
        
        if (!response.ok && response.status >= 500) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        return response;
      }, 3, 1000);

      if (!processResponse.ok) {
        throw new Error('Processing failed');
      }

      // Simulate transcription progress
      setStatus({ stage: 'transcribing', progress: 60, message: 'Transcribing audio with Whisper AI...' });
      
      // Poll for completion
      let attempts = 0;
      const maxAttempts = 30;
      const pollInterval = 2000; // 2 seconds

      const pollForCompletion = async () => {
        const statusHeaders: Record<string, string> = {};
        
        // Add x-session-id header for anonymous users
        if (isAnonymous && sessionId) {
          statusHeaders['x-session-id'] = sessionId;
        }
        
        // Check status with retry logic for network failures
        const statusResponse = await retryWithBackoff(async () => {
          const response = await fetch(`http://localhost:3101/api/voice-notes/${voiceNoteId}?includeTranscription=true&includeSummary=true`, {
            credentials: 'include',
            headers: statusHeaders
          });
          
          if (!response.ok && response.status >= 500) {
            throw new Error(`Server error: ${response.status}`);
          }
          
          return response;
        }, 2, 500); // Less retries and shorter delay for status checks

        if (!statusResponse.ok) {
          throw new Error('Failed to check status');
        }

        const data = await statusResponse.json();
        
        // Check if processing is complete
        if (data.status === 'completed' && data.transcription) {
          // Processing complete - redirect to note page
          setStatus({
            stage: 'complete',
            progress: 100,
            message: 'Processing complete! Redirecting...'
          });
          
          // Clear form
          setFile(null);
          setWhisperPrompt('');
          setGeminiPrompt('');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          
          // Redirect to note details page
          setTimeout(() => {
            router.push(`/note/${voiceNoteId}`);
          }, 500);
        } else if (data.status === 'failed') {
          throw new Error('Processing failed');
        } else if (attempts < maxAttempts) {
          // Update progress
          if (data.transcription && !data.summary) {
            setStatus({ stage: 'summarizing', progress: 80, message: 'Generating AI summary...' });
          }
          
          // Continue polling
          attempts++;
          setTimeout(pollForCompletion, pollInterval);
        } else {
          throw new Error('Processing timeout');
        }
      };

      // Start polling after a short delay
      setTimeout(pollForCompletion, 2000);

    } catch (error: any) {
      const { title, message } = formatErrorForDisplay(error);
      setStatus({
        stage: 'error',
        progress: 0,
        message
      });
      toast.error(formatErrorForToast(error));
    }
  };

  const resetUpload = () => {
    setFile(null);
    setWhisperPrompt('');
    setStatus({ stage: 'idle', progress: 0, message: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <Header 
        currentPage="home"
        customRightContent={
          <nav className={styles.nav}>
            {/* Anonymous User Info */}
            {isAnonymous && !user && (
              <>
                <span className={styles.usageInfo}>
                  Free uses: {5 - anonymousUsageCount} / 5 remaining
                </span>
                <span className={styles.usageHint}>
                  No sign-up required!
                </span>
              </>
            )}
            
            {user ? (
              <>
                <span className={styles.usageInfo}>
                  Credits: {(user.creditLimit || 5) - (user.creditsUsed || 0)} / {user.creditLimit || 5}
                </span>
                <Link href="/dashboard" className={styles.navLink}>
                  Dashboard
                </Link>
                <Link href="/library" className={styles.navLink}>
                  Library
                </Link>
                <Link href="/settings" className={styles.navLink}>
                  Settings
                </Link>
                <button
                  onClick={async () => {
                    await logout();
                    router.push('/login');
                  }}
                  className={styles.logoutButton}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/dashboard" className={styles.navLink}>
                  Dashboard
                </Link>
                <Link href="/library" className={styles.navLink}>
                  Library
                </Link>
                <Link href="/login" className={styles.navLink}>
                  Login
                </Link>
                <Link href="/register" className={styles.signupButton}>
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        }
      />

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.uploadCard}>
          <div className={styles.hero}>
            <h2 className={styles.title}>
              Voice Note Transcription & Summarization
            </h2>
            <p className={styles.subtitle}>
              Upload your voice recording and get an AI-powered transcription and summary
            </p>
          </div>

          {/* Status Display */}
          {status.stage !== 'idle' && (
            <div className={styles.statusContainer}>
              {/* Progress Bar */}
              {status.stage !== 'complete' && status.stage !== 'error' && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressHeader}>
                    <span>{status.message}</span>
                    <span>{status.progress}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={`${styles.progressFill} ${styles.progressActive}`}
                      style={{ width: `${status.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Status Message */}
              {status.stage === 'complete' && (
                <div className={styles.successMessage}>
                  <svg className={styles.successIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className={styles.statusText}>{status.message}</p>
                  {status.result && (
                    <Link
                      href={`/note/${status.result.id}`}
                      className={styles.viewResultsButton}
                    >
                      View Full Results →
                    </Link>
                  )}
                </div>
              )}
              
              {status.stage === 'error' && (
                <div className={styles.errorMessage}>
                  <svg className={styles.errorIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className={styles.statusText}>{status.message}</p>
                  <button onClick={resetUpload} className={styles.retryButton}>
                    Try Again
                  </button>
                </div>
              )}

              {/* Processing Animation */}
              {!['idle', 'complete', 'error'].includes(status.stage) && (
                <div className={styles.spinner} />
              )}
            </div>
          )}

          {/* Upload Form */}
          {(status.stage === 'idle' || status.stage === 'error') && (
            <div className={styles.uploadForm}>
              {/* Project Selection */}
              {user && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Project Context (Optional)
                  </label>
                  <ProjectSelector
                    onProjectSelect={setSelectedProjectId}
                    selectedProjectId={selectedProjectId}
                  />
                  <EntityPills
                    projectId={selectedProjectId}
                    className={styles.entityPills}
                  />
                </div>
              )}
              
              {/* File Upload */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Select Audio File
                </label>
                <label className={styles.dropzone}>
                  <div className={styles.dropzoneContent}>
                    {file ? (
                      <>
                        <svg className={styles.checkIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className={styles.fileName}>{file.name}</p>
                        <p className={styles.fileSize}>
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <svg className={styles.uploadIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className={styles.dropzoneText}>
                          <span>Click to upload</span> or drag and drop
                        </p>
                        <p className={styles.dropzoneHint}>MP3, M4A, WAV up to 100MB</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className={styles.hiddenInput}
                    accept="audio/*"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              {/* Minimal Model Toggle */}
              <div className={styles.modelToggle}>
                <button 
                  type="button"
                  className={selectedModel === 'google/gemini-2.0-flash-001' ? styles.active : ''}
                  onClick={() => setSelectedModel('google/gemini-2.0-flash-001')}
                >
                  Smart
                </button>
                <button 
                  type="button"
                  className={selectedModel === 'gpt-4o-transcribe' ? styles.active : ''}
                  onClick={() => setSelectedModel('gpt-4o-transcribe')}
                >
                  Fast
                </button>
              </div>

              {/* Simplified Advanced Options - Only shows when file is selected */}
              <AdvancedOptions
                whisperPrompt={whisperPrompt}
                onWhisperPromptChange={setWhisperPrompt}
                selectedModel={selectedModel}
                geminiPrompt={geminiPrompt}
                onGeminiPromptChange={setGeminiPrompt}
                showOptions={!!file}
              />

              {/* Submit Button */}
              <button
                onClick={handleUpload}
                disabled={!file || (status.stage !== 'idle' && status.stage !== 'error') || (isAnonymous && anonymousUsageCount >= 5)}
                className={`${styles.submitButton} ${
                  !file || (isAnonymous && anonymousUsageCount >= 5) ? styles.submitButtonDisabled : ''
                }`}
              >
                {isAnonymous && anonymousUsageCount >= 5 
                  ? 'Sign Up to Continue' 
                  : 'Upload and Process'}
              </button>


              {/* User Status */}
              {user && (
                <div className={styles.userStatus}>
                  {user.tier === 'free' ? (
                    <p>
                      Free tier: {(user.creditLimit || 5) - (user.creditsUsed || 0)} transcriptions remaining this month.{' '}
                      <Link href="/pricing" className={styles.upgradeLink}>
                        Upgrade for more
                      </Link>
                    </p>
                  ) : (
                    <p>
                      {user.tier} tier: {(user.creditLimit || 5) - (user.creditsUsed || 0)} / {user.creditLimit || 5} transcriptions this month
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>High-Quality Transcription</h3>
            <p className={styles.featureDescription}>Powered by OpenAI Whisper for accurate voice-to-text conversion</p>
          </div>
          
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Smart Summaries</h3>
            <p className={styles.featureDescription}>AI-generated key points, action items, and insights</p>
          </div>
          
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Real-Time Status</h3>
            <p className={styles.featureDescription}>Track processing progress with live status updates</p>
          </div>
        </div>
      </main>
      
      {/* Conversion Modal */}
      <ConversionModal 
        isOpen={showConversionModal}
        onClose={() => setShowConversionModal(false)}
        usageCount={5}
      />
      
    </div>
  );
}
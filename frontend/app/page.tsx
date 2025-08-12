'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConversionModal from '@/components/ConversionModal';
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

export default function HomePage() {
  const { user, logout, isAnonymous, anonymousUsageCount, anonymousSessionId, refreshAnonymousUsage } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [language, setLanguage] = useState<'AUTO' | 'EN' | 'PL'>('AUTO');
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: 'idle',
    progress: 0,
    message: ''
  });

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
      setStatus({
        stage: 'error',
        progress: 0,
        message: `You've used all 5 free transcriptions. Create an account to continue!`
      });
    }
  }, [user, isAnonymous, anonymousUsageCount]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setStatus({
          stage: 'error',
          progress: 0,
          message: 'Invalid file type. Please upload an audio file (MP3, M4A, WAV, etc.)'
        });
        return;
      }
      
      // Validate file size (100MB limit)
      if (selectedFile.size > 100 * 1024 * 1024) {
        setStatus({
          stage: 'error',
          progress: 0,
          message: 'File too large. Maximum size is 100MB.'
        });
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

    // Start upload process
    setStatus({ stage: 'uploading', progress: 20, message: 'Uploading voice note...' });

    const formData = new FormData();
    formData.append('file', file);
    // Only send language if not AUTO (AUTO means automatic detection)
    if (language !== 'AUTO') {
      formData.append('language', language);
    }
    if (customPrompt) {
      formData.append('customPrompt', customPrompt);
    }
    // Add sessionId for anonymous users
    if (isAnonymous && anonymousSessionId) {
      formData.append('sessionId', anonymousSessionId);
    }

    try {
      // Upload file
      const uploadResponse = await fetch('http://localhost:3101/api/voice-notes', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.message || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();
      const voiceNoteId = uploadData.voiceNote.id;

      // Update status - processing
      setStatus({ stage: 'processing', progress: 40, message: 'Processing audio file...' });
      
      // Start processing
      const processResponse = await fetch(`http://localhost:3101/api/voice-notes/${voiceNoteId}/process`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(
          language === 'AUTO' 
            ? {} 
            : { language }
        )
      });

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
        const statusResponse = await fetch(`http://localhost:3101/api/voice-notes/${voiceNoteId}?includeTranscription=true&includeSummary=true`, {
          credentials: 'include'
        });

        if (!statusResponse.ok) {
          throw new Error('Failed to check status');
        }

        const data = await statusResponse.json();
        
        if (data.status === 'completed' && data.transcription && data.summary) {
          // Success!
          setStatus({
            stage: 'complete',
            progress: 100,
            message: 'Processing complete!',
            result: {
              id: voiceNoteId,
              transcription: data.transcription.text,
              summary: data.summary.text
            }
          });
          
          // Clear form
          setFile(null);
          setCustomPrompt('');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          
          // Update anonymous usage count
          if (isAnonymous) {
            refreshAnonymousUsage();
          }
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
      setStatus({
        stage: 'error',
        progress: 0,
        message: error.message || 'An error occurred during processing'
      });
    }
  };

  const resetUpload = () => {
    setFile(null);
    setCustomPrompt('');
    setLanguage('AUTO');
    setStatus({ stage: 'idle', progress: 0, message: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>nano-Grażynka</h1>
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
                <Link href="/login" className={styles.navLink}>
                  Login
                </Link>
                <Link href="/register" className={styles.signupButton}>
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

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
                      className={`${styles.progressFill} ${
                        status.stage === 'error' ? styles.progressError : 
                        status.stage === 'complete' ? styles.progressSuccess : 
                        styles.progressActive
                      }`}
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

              {/* Language Selection */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Language
                </label>
                <div className={styles.languageButtons}>
                  {(['AUTO', 'EN', 'PL'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`${styles.languageButton} ${language === lang ? styles.languageButtonActive : ''}`}
                    >
                      {lang === 'AUTO' ? 'Auto-detect' : lang === 'EN' ? 'English' : 'Polish'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt */}
              <div className={styles.formGroup}>
                <label htmlFor="customPrompt" className={styles.label}>
                  Custom Instructions (Optional)
                </label>
                <textarea
                  id="customPrompt"
                  rows={3}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Add any specific instructions for the AI summary..."
                  className={styles.textarea}
                />
              </div>

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

              {/* Anonymous User Benefits */}
              {isAnonymous && !user && (
                <div className={styles.benefitsCard}>
                  <h4 className={styles.benefitsTitle}>
                    Try it free - no signup required!
                  </h4>
                  <ul className={styles.benefitsList}>
                    <li>✓ {5 - anonymousUsageCount} free transcriptions remaining</li>
                    <li>✓ Full quality AI transcription & summary</li>
                    <li>✓ No credit card required</li>
                  </ul>
                  {anonymousUsageCount > 0 && (
                    <p className={styles.benefitsNote}>
                      Love it? <Link href="/register" className={styles.benefitsLink}>Create an account</Link> to save your transcriptions and get more monthly credits!
                    </p>
                  )}
                </div>
              )}

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
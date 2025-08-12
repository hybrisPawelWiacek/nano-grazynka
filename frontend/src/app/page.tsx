'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [language, setLanguage] = useState<'AUTO' | 'EN' | 'PL'>('AUTO');
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: 'idle',
    progress: 0,
    message: ''
  });

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (user) {
      // Check remaining credits
      const creditsRemaining = (user.creditLimit || 5) - (user.creditsUsed || 0);
      if (creditsRemaining <= 0 && status.stage === 'idle') {
        setStatus({
          stage: 'error',
          progress: 0,
          message: `You've used all ${user.creditLimit} transcriptions this month. Upgrade your plan for more.`
        });
      }
    }
  }, [user]);

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
    
    if (!user) {
      router.push('/login');
      return;
    }

    // Start upload process
    setStatus({ stage: 'uploading', progress: 20, message: 'Uploading voice note...' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    if (customPrompt) {
      formData.append('customPrompt', customPrompt);
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
        body: JSON.stringify({ language })
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

  const getProgressColor = () => {
    switch (status.stage) {
      case 'error':
        return 'bg-red-600';
      case 'complete':
        return 'bg-green-600';
      default:
        return 'bg-indigo-600';
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">nano-Grażynka</h1>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">
                    Credits: {(user.creditLimit || 5) - (user.creditsUsed || 0)} / {user.creditLimit || 5}
                  </span>
                  <Link
                    href="/dashboard"
                    className="text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/settings"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Settings
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Voice Note Transcription & Summarization
            </h2>
            <p className="text-gray-600">
              Upload your voice recording and get an AI-powered transcription and summary
            </p>
          </div>

          {/* Status Display */}
          {status.stage !== 'idle' && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              {/* Progress Bar */}
              {status.stage !== 'complete' && status.stage !== 'error' && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{status.message}</span>
                    <span>{status.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
                      style={{ width: `${status.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Status Message */}
              <div className={`text-center ${
                status.stage === 'error' ? 'text-red-600' : 
                status.stage === 'complete' ? 'text-green-600' : 
                'text-gray-700'
              }`}>
                {status.stage === 'complete' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center mb-4">
                      <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-lg">{status.message}</p>
                    {status.result && (
                      <div className="mt-4 space-y-4 text-left">
                        <Link
                          href={`/voice-notes/${status.result.id}`}
                          className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          View Full Results →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
                
                {status.stage === 'error' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center mb-4">
                      <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="font-semibold">{status.message}</p>
                    <button
                      onClick={resetUpload}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {/* Processing Animation */}
                {!['idle', 'complete', 'error'].includes(status.stage) && (
                  <div className="flex justify-center mt-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Form */}
          {(status.stage === 'idle' || status.stage === 'error') && (
            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Audio File
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {file ? (
                        <>
                          <svg className="w-8 h-8 mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-gray-900 font-semibold">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </>
                      ) : (
                        <>
                          <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">MP3, M4A, WAV up to 100MB</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="audio/*"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['AUTO', 'EN', 'PL'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${
                        language === lang
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {lang === 'AUTO' ? 'Auto-detect' : lang === 'EN' ? 'English' : 'Polish'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt */}
              <div>
                <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  id="customPrompt"
                  rows={3}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Add any specific instructions for the AI summary..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleUpload}
                disabled={!file || (status.stage !== 'idle' && status.stage !== 'error')}
                className={`w-full py-3 px-4 rounded-md font-semibold transition-colors ${
                  file && status.stage === 'idle'
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {user ? 'Upload and Process' : 'Login to Upload'}
              </button>

              {/* User Status */}
              {user && (
                <div className="text-center text-sm text-gray-600">
                  {user.tier === 'free' ? (
                    <p>
                      Free tier: {(user.creditLimit || 5) - (user.creditsUsed || 0)} transcriptions remaining this month.{' '}
                      <Link href="/pricing" className="text-indigo-600 hover:text-indigo-500">
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
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-indigo-600 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">High-Quality Transcription</h3>
            <p className="mt-2 text-gray-600">Powered by OpenAI Whisper for accurate voice-to-text conversion</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-indigo-600 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Smart Summaries</h3>
            <p className="mt-2 text-gray-600">AI-generated key points, action items, and insights</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-indigo-600 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Real-Time Status</h3>
            <p className="mt-2 text-gray-600">Track processing progress with live status updates</p>
          </div>
        </div>
      </main>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MoreHorizontal, Sparkles, Download, Trash2, RefreshCw } from 'lucide-react';
import { voiceNotesApi } from '@/lib/api/voiceNotes';
import { VoiceNote, ProcessingStatus } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import ContentSection from '@/components/ContentSection';
import Header from '@/components/Header';
import styles from './page.module.css';

const SUMMARY_TEMPLATE = `Focus on:
- Key decisions and conclusions
- Action items with owners
- Technical details discussed
- Next steps and deadlines

Additional requirements: [customize here]`;

export default function VoiceNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { anonymousSessionId } = useAuth();
  const id = params.id as string;
  
  const [voiceNote, setVoiceNote] = useState<VoiceNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'transcription'>('transcription');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCustomizePrompt, setShowCustomizePrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(SUMMARY_TEMPLATE);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initial load
    fetchVoiceNote(false);
    
    // Cleanup on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [id]);

  useEffect(() => {
    // Start or stop polling based on voice note status
    if (voiceNote?.status === 'processing' || voiceNote?.status === 'pending') {
      // Start polling if not already polling
      if (!pollingInterval) {
        const interval = setInterval(() => {
          fetchVoiceNote(true);
        }, 2000);
        setPollingInterval(interval);
      }
    } else {
      // Stop polling if status is complete
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [voiceNote?.status]);

  const fetchVoiceNote = async (isPolling: boolean = false) => {
    // Only show loading on initial load, not during polling
    if (!isPolling) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const data = await voiceNotesApi.getById(id);
      
      // Only update state if data has actually changed
      setVoiceNote(prevNote => {
        // Check if key fields have changed
        if (!prevNote || 
            prevNote.status !== data.status ||
            prevNote.transcription?.text !== data.transcription?.text ||
            prevNote.summary?.summary !== data.summary?.summary) {
          return data;
        }
        return prevNote;
      });
      
      // Update processing status
      if (data.status === 'processing') {
        if (!data.transcription) {
          setProcessingStatus('Transcribing audio...');
        } else if (!data.summary) {
          setProcessingStatus('Generating summary...');
        }
      } else {
        setProcessingStatus(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load voice note');
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  };

  const handleGenerateSummary = async () => {
    if (!voiceNote) return;
    
    setIsGeneratingSummary(true);
    setError(null);
    
    try {
      const updatedNote = await voiceNotesApi.regenerateSummary(
        voiceNote.id,
        customPrompt !== SUMMARY_TEMPLATE ? customPrompt : undefined
      );
      
      // Directly update with the returned data
      setVoiceNote(updatedNote);
      setShowCustomizePrompt(false);
      setProcessingStatus(null); // Clear processing status since it's already done
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleExport = async (format: 'markdown' | 'json') => {
    if (!voiceNote) return;
    
    try {
      const blob = await voiceNotesApi.export(voiceNote.id, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${voiceNote.title || 'voice-note'}.${format === 'markdown' ? 'md' : 'json'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export');
    }
  };

  const handleDelete = async () => {
    if (!voiceNote || !confirm('Are you sure you want to delete this voice note?')) return;
    
    try {
      await voiceNotesApi.delete(voiceNote.id);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading voice note...</p>
        </div>
      </div>
    );
  }

  if (error && !voiceNote) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>{error}</p>
          <button onClick={() => router.push('/dashboard')} className={styles.backButton}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!voiceNote) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>Voice note not found</p>
          <button onClick={() => router.push('/dashboard')} className={styles.backButton}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const latestTranscription = voiceNote.transcription;
  const latestSummary = voiceNote.summary;

  return (
    <div className={styles.page}>
      {/* Header */}
      <Header 
        currentPage="note"
        showBackButton={true}
        onBackClick={() => router.back()}
        showMoreMenu={true}
        moreMenuItems={[
          {
            icon: <Download size={16} />,
            label: 'Export as Markdown',
            onClick: () => handleExport('markdown')
          },
          {
            icon: <Download size={16} />,
            label: 'Export as JSON',
            onClick: () => handleExport('json')
          },
          {
            isDivider: true,
            label: '',
            onClick: () => {}
          },
          {
            icon: <Trash2 size={16} />,
            label: 'Delete Note',
            onClick: handleDelete,
            isDanger: true
          }
        ]}
        onMoreMenuToggle={setShowMoreMenu}
      />

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.content}>
            {/* Note Header */}
            <div className={styles.noteHeader}>
              <h1 className={styles.title}>{voiceNote.displayTitle || voiceNote.aiGeneratedTitle || voiceNote.title || 'Untitled Note'}</h1>
              {voiceNote.briefDescription && (
                <p className={styles.briefDescription}>{voiceNote.briefDescription}</p>
              )}
              <div className={styles.metadata}>
                {voiceNote.derivedDate && (
                  <span className={styles.metaItem}>
                    📅 {new Date(voiceNote.derivedDate).toLocaleDateString()}
                  </span>
                )}
                {voiceNote.status && (
                  <span className={`${styles.status} ${styles[`status${voiceNote.status.charAt(0).toUpperCase() + voiceNote.status.slice(1)}`]}`}>
                    {voiceNote.status}
                  </span>
                )}
                <span className={styles.metaItem}>
                  {new Date(voiceNote.createdAt).toLocaleDateString()}
                </span>
                {voiceNote.duration && (
                  <span className={styles.metaItem}>
                    {Math.round(voiceNote.duration / 60)} min
                  </span>
                )}
                {voiceNote.language && (
                  <span className={styles.metaItem}>
                    {voiceNote.language}
                  </span>
                )}
              </div>
            </div>

            {/* Processing Status */}
            {processingStatus && (
              <div className={styles.processingBar}>
                <div className={styles.processingSpinner} />
                <span>{processingStatus}</span>
              </div>
            )}

            {/* Clean Tab Switcher */}
            <div className={styles.tabs}>
              <button
                onClick={() => setActiveTab('summary')}
                className={`${styles.tab} ${activeTab === 'summary' ? styles.active : ''}`}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab('transcription')}
                className={`${styles.tab} ${activeTab === 'transcription' ? styles.active : ''}`}
              >
                Transcription
              </button>
            </div>

            {/* Content Area */}
            <div className={styles.tabContent}>
        {activeTab === 'summary' ? (
          <div className={styles.summaryContent}>
            {/* Show loading skeleton when generating */}
            {isGeneratingSummary || (voiceNote.status === 'processing' && !latestSummary && processingStatus?.includes('summary')) ? (
              <div className={styles.summaryLoading}>
                <div className={styles.skeletonCard}>
                  <div className={styles.skeletonHeader}>
                    <div className={styles.skeletonTitle}></div>
                    <div className={styles.skeletonSparkle}>✨</div>
                  </div>
                  <div className={styles.skeletonContent}>
                    <div className={styles.skeletonLine} style={{ width: '90%' }}></div>
                    <div className={styles.skeletonLine} style={{ width: '75%' }}></div>
                    <div className={styles.skeletonLine} style={{ width: '85%' }}></div>
                    <div className={styles.skeletonLine} style={{ width: '60%' }}></div>
                    
                    <div className={styles.skeletonSection}>
                      <div className={styles.skeletonSubtitle}></div>
                      <div className={styles.skeletonBullet}></div>
                      <div className={styles.skeletonBullet} style={{ width: '60%' }}></div>
                      <div className={styles.skeletonBullet} style={{ width: '65%' }}></div>
                    </div>
                    
                    <div className={styles.generatingText}>
                      <span>Generating your summary</span>
                      <span className={styles.dots}>...</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : latestSummary ? (
              <div className={styles.summaryFadeIn}>
                
                <ContentSection
                  title="Summary"
                  content={[
                    latestSummary.summary,
                    latestSummary.keyPoints && latestSummary.keyPoints.length > 0 
                      ? '\n\n### Key Points\n' + latestSummary.keyPoints.map(point => `- ${point}`).join('\n')
                      : '',
                    latestSummary.actionItems && latestSummary.actionItems.length > 0
                      ? '\n\n### Action Items\n' + latestSummary.actionItems.map(item => `- ${item}`).join('\n')
                      : ''
                  ].filter(Boolean).join('')}
                  type="summary"
                  onRegenerate={() => setShowCustomizePrompt(!showCustomizePrompt)}
                  showRegenerate={!!latestTranscription}
                  isRegenerating={voiceNote.status === 'processing' || isGeneratingSummary}
                />
                
                {/* Inline customization for regeneration */}
                {showCustomizePrompt && (
                  <div className={styles.inlineCustomize}>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className={styles.customizeTextarea}
                      placeholder="Add custom instructions for the summary..."
                      rows={8}
                    />
                    <div className={styles.customizeActions}>
                      <button
                        onClick={() => {
                          setShowCustomizePrompt(false);
                          setCustomPrompt(SUMMARY_TEMPLATE);
                        }}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleGenerateSummary}
                        disabled={isGeneratingSummary}
                        className={styles.generateButton}
                      >
                        {isGeneratingSummary ? (
                          <>
                            <RefreshCw size={16} className={styles.spinning} />
                            Regenerating...
                          </>
                        ) : (
                          <>Regenerate Summary</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.emptySummary}>
                <div className={styles.emptyIcon}>
                  <Sparkles size={32} />
                </div>
                <h3 className={styles.emptyTitle}>No summary yet</h3>
                {voiceNote.status === 'completed' && latestTranscription ? (
                  <>
                    {!showCustomizePrompt ? (
                      <>
                        <p className={styles.emptyText}>Generate an AI summary of your transcription</p>
                        <button
                          onClick={() => handleGenerateSummary()}
                          className={styles.primaryButton}
                          disabled={isGeneratingSummary}
                        >
                          {isGeneratingSummary ? (
                            <>
                              <RefreshCw size={16} className={styles.spinning} />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles size={16} />
                              Generate Summary
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setShowCustomizePrompt(true)}
                          className={styles.customizeLink}
                        >
                          Customize instructions
                        </button>
                      </>
                    ) : (
                      <div className={styles.inlineCustomize}>
                        <textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          className={styles.customizeTextarea}
                          placeholder="Add custom instructions for the summary..."
                          rows={8}
                          autoFocus
                        />
                        <div className={styles.customizeActions}>
                          <button
                            onClick={() => {
                              setShowCustomizePrompt(false);
                              setCustomPrompt(SUMMARY_TEMPLATE);
                            }}
                            className={styles.cancelButton}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleGenerateSummary}
                            disabled={isGeneratingSummary}
                            className={styles.generateButton}
                          >
                            {isGeneratingSummary ? (
                              <>
                                <RefreshCw size={16} className={styles.spinning} />
                                Generating...
                              </>
                            ) : (
                              <>Generate Summary</>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className={styles.emptyText}>Transcription required to generate summary</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.transcriptionContent}>
            {latestTranscription ? (
              <ContentSection
                title="Transcription"
                content={latestTranscription.text}
                type="transcription"
              />
            ) : (
              <div className={styles.emptyTranscription}>
                <p>No transcription available yet</p>
              </div>
            )}
          </div>
        )}
      </div>
          </div>
        </div>
      </main>
    </div>
  );
}
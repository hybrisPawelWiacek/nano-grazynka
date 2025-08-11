'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { voiceNotesApi } from '@/lib/api/voiceNotes';
import { VoiceNote } from '@/lib/types';
import styles from './page.module.css';

export default function VoiceNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [voiceNote, setVoiceNote] = useState<VoiceNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reprocessing, setReprocessing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcription' | 'summary'>('summary');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showReprocessForm, setShowReprocessForm] = useState(false);

  useEffect(() => {
    fetchVoiceNote();
  }, [id]);

  const fetchVoiceNote = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await voiceNotesApi.getById(id);
      setVoiceNote(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load voice note');
    } finally {
      setLoading(false);
    }
  };

  const handleReprocess = async () => {
    if (!voiceNote) return;
    
    setReprocessing(true);
    setError(null);
    
    try {
      await voiceNotesApi.reprocess(voiceNote.id, customPrompt || undefined);
      await fetchVoiceNote();
      setShowReprocessForm(false);
      setCustomPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reprocess voice note');
    } finally {
      setReprocessing(false);
    }
  };

  const handleExport = async (format: 'markdown' | 'json') => {
    if (!voiceNote) return;
    
    setExporting(true);
    setError(null);
    
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
      setError(err instanceof Error ? err.message : 'Failed to export voice note');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!voiceNote || !confirm('Are you sure you want to delete this voice note?')) return;
    
    try {
      await voiceNotesApi.delete(voiceNote.id);
      router.push('/library');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete voice note');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading voice note...</p>
        </div>
      </div>
    );
  }

  if (error && !voiceNote) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error Loading Voice Note</h2>
          <p>{error}</p>
          <Link href="/library" className={styles.backButton}>
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  if (!voiceNote) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Voice Note Not Found</h2>
          <Link href="/library" className={styles.backButton}>
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const latestTranscription = voiceNote.transcriptions?.[0];
  const latestSummary = voiceNote.summaries?.[0];

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <h1 className={styles.logo}>nano-Grazynka</h1>
          <div className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>
              Upload
            </Link>
            <Link href="/library" className={styles.navLink}>
              Library
            </Link>
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.breadcrumb}>
          <Link href="/library">Library</Link>
          <span>/</span>
          <span>{voiceNote.title || 'Untitled Note'}</span>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <span>{error}</span>
            <button onClick={() => setError(null)} className={styles.dismissButton}>
              Dismiss
            </button>
          </div>
        )}

        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h2 className={styles.title}>{voiceNote.title || 'Untitled Note'}</h2>
            <div className={styles.metadata}>
              <span className={`${styles.status} ${styles[`status${voiceNote.status}`]}`}>
                {voiceNote.status}
              </span>
              <span className={styles.language}>
                {voiceNote.language === 'en' ? '🇬🇧 English' : '🇵🇱 Polish'}
              </span>
              <span className={styles.date}>
                {formatDate(voiceNote.createdAt)}
              </span>
              {voiceNote.duration && (
                <span className={styles.duration}>
                  {voiceNotesApi.formatDuration(voiceNote.duration)}
                </span>
              )}
            </div>
            {voiceNote.tags && voiceNote.tags.length > 0 && (
              <div className={styles.tags}>
                {voiceNote.tags.map(tag => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={() => handleExport('markdown')}
              disabled={exporting || voiceNote.status !== 'completed'}
              className={styles.actionButton}
            >
              Export MD
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={exporting || voiceNote.status !== 'completed'}
              className={styles.actionButton}
            >
              Export JSON
            </button>
            <button
              onClick={() => setShowReprocessForm(!showReprocessForm)}
              disabled={voiceNote.status !== 'completed'}
              className={styles.actionButton}
            >
              Reprocess
            </button>
            <button
              onClick={handleDelete}
              className={`${styles.actionButton} ${styles.deleteButton}`}
            >
              Delete
            </button>
          </div>
        </div>

        {showReprocessForm && (
          <div className={styles.reprocessForm}>
            <h3>Reprocess with Custom Prompt</h3>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Enter a custom prompt for reprocessing (optional)..."
              className={styles.promptInput}
              rows={4}
            />
            <div className={styles.reprocessActions}>
              <button
                onClick={handleReprocess}
                disabled={reprocessing}
                className={styles.primaryButton}
              >
                {reprocessing ? 'Reprocessing...' : 'Start Reprocessing'}
              </button>
              <button
                onClick={() => {
                  setShowReprocessForm(false);
                  setCustomPrompt('');
                }}
                className={styles.secondaryButton}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.tabs}>
            <button
              onClick={() => setActiveTab('summary')}
              className={`${styles.tab} ${activeTab === 'summary' ? styles.tabActive : ''}`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('transcription')}
              className={`${styles.tab} ${activeTab === 'transcription' ? styles.tabActive : ''}`}
            >
              Transcription
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'summary' && latestSummary ? (
              <div className={styles.summary}>
                <section className={styles.section}>
                  <h3>Summary</h3>
                  <p>{latestSummary.summary}</p>
                </section>

                {latestSummary.keyPoints && latestSummary.keyPoints.length > 0 && (
                  <section className={styles.section}>
                    <h3>Key Points</h3>
                    <ul className={styles.list}>
                      {latestSummary.keyPoints.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {latestSummary.actionItems && latestSummary.actionItems.length > 0 && (
                  <section className={styles.section}>
                    <h3>Action Items</h3>
                    <ul className={styles.list}>
                      {latestSummary.actionItems.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </section>
                )}

                <div className={styles.summaryMeta}>
                  <span>Model: {latestSummary.model}</span>
                  <span>Version: {latestSummary.version}</span>
                  <span>Created: {formatDate(latestSummary.createdAt)}</span>
                </div>
              </div>
            ) : activeTab === 'transcription' && latestTranscription ? (
              <div className={styles.transcription}>
                <div className={styles.transcriptionText}>
                  {latestTranscription.text}
                </div>
                <div className={styles.transcriptionMeta}>
                  <span>Model: {latestTranscription.model}</span>
                  <span>Confidence: {(latestTranscription.confidence * 100).toFixed(1)}%</span>
                  <span>Created: {formatDate(latestTranscription.createdAt)}</span>
                </div>
              </div>
            ) : (
              <div className={styles.noContent}>
                <p>No {activeTab} available yet.</p>
                {voiceNote.status === 'pending' && (
                  <p>The voice note is pending processing.</p>
                )}
                {voiceNote.status === 'processing' && (
                  <p>The voice note is currently being processed.</p>
                )}
                {voiceNote.status === 'failed' && (
                  <p>Processing failed. Please try reprocessing.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
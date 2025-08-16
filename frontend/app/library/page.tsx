'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { voiceNotesApi } from '@/lib/api/voiceNotes';
import { VoiceNote, ProcessingStatus, Language } from '@/lib/types';
import { getOrCreateSessionId } from '@/lib/anonymousSession';
import { useAuth } from '@/contexts/AuthContext';
import VoiceNoteCard from '@/components/VoiceNoteCard';
import { toast } from 'sonner';
import { formatErrorForToast } from '@/lib/error-messages';
import VoiceNoteSkeleton from '@/components/VoiceNoteSkeleton';
import Header from '@/components/Header';
import styles from './page.module.css';

interface SearchFilters {
  query: string;
  status?: ProcessingStatus;
  language?: Language;
}

export default function LibraryPage() {
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, anonymousSessionId } = useAuth();
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProcessingStatus | ''>('');
  const [retryCount, setRetryCount] = useState(0);
  const [rateLimitRetryTime, setRateLimitRetryTime] = useState<number | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number>(0);

  const itemsPerPage = 10;
  const maxRetries = 3;

  // Countdown timer for rate limit retry
  useEffect(() => {
    if (retryCountdown > 0) {
      const timer = setTimeout(() => {
        setRetryCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (retryCountdown === 0 && rateLimitRetryTime) {
      // Countdown finished, auto-retry
      setRateLimitRetryTime(null);
      setCurrentPage(prev => prev); // Trigger reload
    }
  }, [retryCountdown, rateLimitRetryTime]);

  useEffect(() => {
    let abortFunction: (() => void) | null = null;

    const loadVoiceNotes = async () => {
      // Wait for auth to be ready
      if (authLoading) {
        return;
      }
      
      // For anonymous users, ensure session ID is available
      // Double-check both context and localStorage
      if (!user) {
        const localStorageSessionId = localStorage.getItem('anonymousSessionId');
        if (!localStorageSessionId && !anonymousSessionId) {
          // Session not ready yet, wait a bit - but prevent infinite retries
          if (retryCount < maxRetries) {
            setRetryCount(prev => prev + 1);
            setTimeout(() => {
              loadVoiceNotes();
            }, 500); // Increased delay from 100ms to 500ms
          } else {
            setError('Session initialization failed. Please refresh the page.');
          }
          return;
        }
      }
      
      // Reset retry count on successful session check
      if (retryCount > 0) {
        setRetryCount(0);
      }
      
      setLoading(true);
      setError(null);
      
      const { promise, abort } = voiceNotesApi.listWithAbort({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        status: statusFilter || undefined,
      });
      
      abortFunction = abort;
      
      try {
        const response = await promise;
        setVoiceNotes(response.items || []);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalItems(response.pagination?.total || 0);
      } catch (err: any) {
        // Don't show error for cancelled requests
        if (!err.cancelled) {
          // Check for rate limit error (429)
          if (err.status === 429 || err.message?.includes('429') || err.message?.includes('rate limit')) {
            const retryAfter = err.retryAfter || 60; // Default to 60 seconds if not provided
            setRateLimitRetryTime(Date.now() + (retryAfter * 1000));
            setRetryCountdown(retryAfter);
            setError(`Rate limit reached. Retrying in ${retryAfter} seconds...`);
            // Don't show toast for rate limit, we'll show countdown instead
          } else {
            setError(err instanceof Error ? err.message : 'Failed to load voice notes');
            toast.error(formatErrorForToast(err));
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadVoiceNotes();

    // Cleanup function to abort request on unmount or dependency change
    return () => {
      if (abortFunction) {
        abortFunction();
      }
    };
  }, [currentPage, searchQuery, statusFilter, authLoading, user, anonymousSessionId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    // The useEffect will automatically refetch when currentPage changes
  };

  const handleDelete = async (id: string) => {
    // The VoiceNoteCard component handles the deletion and confirmation
    // Force a refresh by toggling a state that triggers the useEffect
    setCurrentPage(prev => prev);  // This will trigger the useEffect to reload
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className={styles.pagination}>
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className={styles.pageButton}
        >
          ← Previous
        </button>
        <span className={styles.pageInfo}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className={styles.pageButton}
        >
          Next →
        </button>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <Header currentPage="library" />

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Page Title */}
          <div className={styles.titleSection}>
            <h1 className={styles.title}>Library</h1>
            <p className={styles.subtitle}>
              {totalItems} {totalItems === 1 ? 'note' : 'notes'} in your collection
            </p>
          </div>

          {/* Search and Filters */}
          <div className={styles.searchSection}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProcessingStatus | '')}
                className={styles.filterSelect}
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
              <button type="submit" className={styles.searchButton}>
                Search
              </button>
            </form>
          </div>

          {/* Error State */}
          {error && (
            <div className={styles.errorMessage}>
              <p>
                {retryCountdown > 0 
                  ? `Rate limit reached. Retrying in ${retryCountdown} seconds...`
                  : error}
              </p>
              <button 
                onClick={() => {
                  // Clear rate limit state if manually retrying
                  setRateLimitRetryTime(null);
                  setRetryCountdown(0);
                  setError(null);
                  setCurrentPage(prev => prev);
                }} 
                className={styles.retryButton}
                disabled={retryCountdown > 0}
              >
                {retryCountdown > 0 ? `Wait ${retryCountdown}s` : 'Try Again'}
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className={styles.notesList}>
              {[...Array(3)].map((_, i) => (
                <VoiceNoteSkeleton key={i} />
              ))}
            </div>
          ) : voiceNotes.length === 0 ? (
            /* Empty State */
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" 
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className={styles.emptyTitle}>No notes found</h3>
              <p className={styles.emptyText}>
                {searchQuery || statusFilter
                  ? 'Try adjusting your search filters'
                  : 'Upload your first voice note to get started'}
              </p>
              {!searchQuery && !statusFilter && (
                <Link href="/" className={styles.uploadButton}>
                  Upload Voice Note
                </Link>
              )}
            </div>
          ) : (
            /* Notes List */
            <>
              <div className={styles.notesList}>
                {voiceNotes.map(note => (
                  <VoiceNoteCard 
                    key={note.id} 
                    note={note} 
                    onDelete={handleDelete}
                  />
                ))}
              </div>
              {renderPagination()}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
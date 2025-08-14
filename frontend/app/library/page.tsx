'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { voiceNotesApi } from '@/lib/api/voiceNotes';
import { VoiceNote, ProcessingStatus, Language } from '@/lib/types';
import { getOrCreateSessionId } from '@/lib/anonymousSession';
import VoiceNoteCard from '@/components/VoiceNoteCard';
import styles from './page.module.css';

interface SearchFilters {
  query: string;
  status?: ProcessingStatus;
  language?: Language;
}

export default function LibraryPage() {
  const searchParams = useSearchParams();
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProcessingStatus | ''>('');

  const itemsPerPage = 10;

  const fetchVoiceNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await voiceNotesApi.list({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        status: statusFilter || undefined,
      });
      
      setVoiceNotes(response.items || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load voice notes');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    fetchVoiceNotes();
  }, [fetchVoiceNotes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchVoiceNotes();
  };

  const handleDelete = async (id: string) => {
    // The VoiceNoteCard component handles the deletion and confirmation
    // We just need to refresh the list after successful deletion
    await fetchVoiceNotes();
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
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logo}>
            nano-Grazynka
          </Link>
          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>
              Upload
            </Link>
            <Link href="/dashboard" className={styles.navLink}>
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

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
              <p>{error}</p>
              <button onClick={fetchVoiceNotes} className={styles.retryButton}>
                Try Again
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
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
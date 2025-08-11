'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import VoiceNoteCard from '@/components/VoiceNoteCard';
import SearchBar from '@/components/SearchBar';
import { voiceNotesApi } from '@/lib/api/voiceNotes';
import { VoiceNote, ProcessingStatus, Language } from '@/lib/types';
import styles from './page.module.css';

interface SearchFilters {
  query: string;
  status?: ProcessingStatus;
  language?: Language;
  startDate?: string;
  endDate?: string;
}

export default function LibraryPage() {
  const searchParams = useSearchParams();
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    status: (searchParams.get('status') as ProcessingStatus) || undefined,
    language: (searchParams.get('language') as Language) || undefined,
    startDate: searchParams.get('from') || undefined,
    endDate: searchParams.get('to') || undefined,
  });

  const itemsPerPage = 12;

  const fetchVoiceNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await voiceNotesApi.list({
        page: currentPage,
        limit: itemsPerPage,
        search: filters.query,
        status: filters.status,
        language: filters.language,
        dateFrom: filters.startDate,
        dateTo: filters.endDate,
      });
      
      setVoiceNotes(response.items || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load voice notes');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchVoiceNotes();
  }, [fetchVoiceNotes]);

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, query }));
    setCurrentPage(1);
  };

  const handleFilter = (filterUpdate: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...filterUpdate }));
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    try {
      await voiceNotesApi.delete(id);
      await fetchVoiceNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete voice note');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className={styles.pageButton}
        >
          1
        </button>
      );
      if (start > 2) {
        pages.push(<span key="dots1" className={styles.pageDots}>...</span>);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`${styles.pageButton} ${i === currentPage ? styles.pageButtonActive : ''}`}
          disabled={i === currentPage}
        >
          {i}
        </button>
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push(<span key="dots2" className={styles.pageDots}>...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={styles.pageButton}
        >
          {totalPages}
        </button>
      );
    }

    return (
      <div className={styles.pagination}>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={styles.pageButton}
        >
          Previous
        </button>
        <div className={styles.pageNumbers}>{pages}</div>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={styles.pageButton}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <h1 className={styles.logo}>nano-Grazynka</h1>
          <div className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>
              Upload
            </Link>
            <Link href="/library" className={`${styles.navLink} ${styles.navLinkActive}`}>
              Library
            </Link>
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>Your Voice Notes</h2>
            <p className={styles.subtitle}>
              {totalItems} {totalItems === 1 ? 'note' : 'notes'} in your library
            </p>
          </div>
        </div>

        <div className={styles.searchSection}>
          <SearchBar
            onSearch={handleSearch}
            onFilterChange={handleFilter}
          />
        </div>

        {error && (
          <div className={styles.error}>
            <span>{error}</span>
            <button onClick={fetchVoiceNotes} className={styles.retryButton}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading voice notes...</p>
          </div>
        ) : (!voiceNotes || voiceNotes.length === 0) ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📭</div>
            <h3>No voice notes found</h3>
            <p>
              {filters.query || filters.status || filters.language
                ? 'Try adjusting your search filters'
                : 'Upload your first voice note to get started'}
            </p>
            {!filters.query && !filters.status && !filters.language && (
              <Link href="/" className={styles.uploadButton}>
                Upload Voice Note
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {voiceNotes.map(note => (
                <VoiceNoteCard
                  key={note.id}
                  voiceNote={note}
                  onDelete={handleDelete}
                />
              ))}
            </div>
            {renderPagination()}
          </>
        )}
      </main>
    </div>
  );
}
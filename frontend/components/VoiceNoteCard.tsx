'use client';

import { useState } from 'react';
import Link from 'next/link';
import { VoiceNote } from '@/lib/types';
import { voiceNotesApi } from '@/lib/api/voiceNotes';
import ConfirmationModal from './ConfirmationModal';
import styles from './VoiceNoteCard.module.css';

interface VoiceNoteCardProps {
  note: VoiceNote;
  onDelete?: (id: string) => void;
}

export default function VoiceNoteCard({ note, onDelete }: VoiceNoteCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusIcon = () => {
    switch (note.status) {
      case 'completed':
        return (
          <svg className={styles.statusIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        );
      case 'processing':
        return <div className={styles.processingSpinner} />;
      case 'failed':
        return (
          <svg className={styles.statusIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        );
      default:
        return (
          <svg className={styles.statusIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        );
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await voiceNotesApi.delete(note.id);
      onDelete?.(note.id);
      setShowDeleteModal(false);
    } catch (error: any) {
      console.error('Failed to delete voice note:', error);
      const errorMessage = error?.message || error?.error || 'Unknown error occurred';
      alert(`Failed to delete voice note: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <>
      <Link href={`/note/${note.id}`} className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{note.displayTitle || note.aiGeneratedTitle || note.title}</h3>
          <div className={`${styles.status} ${styles[note.status]}`}>
            {getStatusIcon()}
            <span className={styles.statusText}>{note.status}</span>
          </div>
        </div>
        {/* Show original filename if AI title exists */}
        {(note.aiGeneratedTitle || note.displayTitle) && note.originalFilename && (
          <div className={styles.originalFilename}>{note.originalFilename}</div>
        )}
        <div className={styles.meta}>
          <span className={styles.language}>{note.language.toUpperCase()}</span>
          {note.duration && (
            <>
              <span className={styles.separator}>•</span>
              <span className={styles.duration}>
                {voiceNotesApi.formatDuration(note.duration)}
              </span>
            </>
          )}
          {note.derivedDate && (
            <>
              <span className={styles.separator}>•</span>
              <span className={styles.derivedDate}>
                {formatDate(note.derivedDate)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Show brief description if available, otherwise fall back to summary */}
      {note.briefDescription ? (
        <div className={styles.summary}>
          <p className={styles.summaryText}>{note.briefDescription}</p>
        </div>
      ) : note.summaries && note.summaries.length > 0 && (
        <div className={styles.summary}>
          <p className={styles.summaryText}>
            {note.summaries[0].summary.substring(0, 150)}
            {note.summaries[0].summary.length > 150 && '...'}
          </p>
        </div>
      )}

      {note.tags && note.tags.length > 0 && (
        <div className={styles.tags}>
          {note.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <span className={styles.date}>{formatDate(note.createdAt)}</span>
        <button
          className={styles.deleteButton}
          onClick={handleDeleteClick}
          aria-label="Delete voice note"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>
    </Link>
    
    <ConfirmationModal
      isOpen={showDeleteModal}
      title="Delete Voice Note"
      message={`Are you sure you want to delete "${note.displayTitle || note.aiGeneratedTitle || note.title}"? This action cannot be undone.`}
      confirmText={isDeleting ? "Deleting..." : "Delete"}
      cancelText="Cancel"
      confirmStyle="danger"
      onConfirm={handleConfirmDelete}
      onCancel={handleCancelDelete}
    />
    </>
  );
}
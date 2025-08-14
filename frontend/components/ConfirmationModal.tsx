'use client';

import { useEffect } from 'react';
import styles from './ConfirmationModal.module.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmStyle = 'danger',
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onCancel} />
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.content}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.message}>{message}</p>
          
          <div className={styles.actions}>
            <button
              className={styles.cancelButton}
              onClick={onCancel}
              autoFocus
            >
              {cancelText}
            </button>
            <button
              className={`${styles.confirmButton} ${styles[confirmStyle]}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
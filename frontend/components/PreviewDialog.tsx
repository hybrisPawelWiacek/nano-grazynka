'use client';

import { useState } from 'react';
import { X, Upload, FileAudio, Clock } from 'lucide-react';
import AdvancedOptions from './AdvancedOptions';
import styles from './PreviewDialog.module.css';

interface PreviewDialogProps {
  file: File;
  onConfirm: (whisperPrompt?: string) => void;
  onCancel: () => void;
  isUploading: boolean;
}

export default function PreviewDialog({ 
  file, 
  onConfirm, 
  onCancel, 
  isUploading 
}: PreviewDialogProps) {
  const [whisperPrompt, setWhisperPrompt] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (file: File) => {
    // For MVP, we'll show file size, actual duration would require audio analysis
    return formatFileSize(file.size);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Upload Voice Note</h2>
          <button
            onClick={onCancel}
            disabled={isUploading}
            className={styles.closeButton}
          >
            <X className={styles.buttonIcon} />
          </button>
        </div>

        {/* File Preview */}
        <div className={styles.filePreview}>
          <div className={styles.filePreviewContent}>
            <FileAudio className={styles.fileIcon} />
            <div className={styles.fileInfo}>
              <p className={styles.fileName}>
                {file.name}
              </p>
              <p className={styles.fileSize}>
                {formatDuration(file)}
              </p>
            </div>
          </div>
        </div>

        {/* Advanced Options (Whisper Prompt) */}
        <AdvancedOptions
          whisperPrompt={whisperPrompt}
          onWhisperPromptChange={setWhisperPrompt}
          isExpanded={showAdvancedOptions}
          onToggle={() => setShowAdvancedOptions(!showAdvancedOptions)}
        />

        {/* Actions */}
        <div className={styles.actions}>
          <button
            onClick={onCancel}
            disabled={isUploading}
            className={`${styles.button} ${styles.buttonSecondary}`}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(whisperPrompt || undefined)}
            disabled={isUploading}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            {isUploading ? (
              <>
                <Clock className={`${styles.buttonIcon} ${styles.spinner}`} />
                Processing...
              </>
            ) : (
              <>
                <Upload className={styles.buttonIcon} />
                Upload & Process
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
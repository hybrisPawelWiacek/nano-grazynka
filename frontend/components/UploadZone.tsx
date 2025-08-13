'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { voiceNotesApi } from '@/lib/api/voiceNotes';
import PreviewDialog from './PreviewDialog';
import styles from './UploadZone.module.css';

import { TranscriptionModel } from './ModelSelection';

interface UploadZoneProps {
  onUploadComplete?: (id: string) => void;
  onError?: (error: string) => void;
}

export default function UploadZone({ onUploadComplete, onError }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file
    const validation = voiceNotesApi.validateFile(file);
    if (!validation.valid) {
      onError?.(validation.error!);
      return;
    }

    // Show preview dialog
    setSelectedFile(file);
    setShowPreview(true);
  };

  const handleUploadConfirm = async (data: {
    whisperPrompt?: string;
    transcriptionModel: TranscriptionModel;
    geminiSystemPrompt?: string;
    geminiUserPrompt?: string;
  }) => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setShowPreview(false);

    try {
      // Upload file with optional custom prompt (using whisperPrompt for backward compatibility)
      const uploadResponse = await voiceNotesApi.upload(selectedFile, data.whisperPrompt);
      setUploadProgress(50);

      // Start processing
      await voiceNotesApi.process(uploadResponse.voiceNote.id);
      setUploadProgress(100);

      // Notify parent component
      onUploadComplete?.(uploadResponse.voiceNote.id);
    } catch (error: any) {
      console.error('Upload failed:', error);
      onError?.(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setSelectedFile(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadCancel = () => {
    setShowPreview(false);
    setSelectedFile(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div
        className={`${styles.uploadZone} ${isDragging ? styles.dragging : ''} ${
          isUploading ? styles.uploading : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={!isUploading ? triggerFileSelect : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,video/mp4,video/webm"
          onChange={handleFileSelect}
          disabled={isUploading}
          className={styles.fileInput}
          aria-label="Choose audio file"
        />

      {isUploading ? (
        <div className={styles.uploadingContent}>
          <div className={styles.spinner} />
          <p className={styles.uploadingText}>Uploading and processing...</p>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className={styles.dropContent}>
          <svg
            className={styles.uploadIcon}
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <h3 className={styles.title}>Drop your audio file here</h3>
          <p className={styles.subtitle}>or click to browse</p>
          <p className={styles.formats}>
            Supports MP3, WAV, M4A, OGG, WebM, MP4 (max 500MB)
          </p>
        </div>
      )}
      </div>

      {/* Preview Dialog */}
      {showPreview && selectedFile && (
        <PreviewDialog
          file={selectedFile}
          onConfirm={handleUploadConfirm}
          onCancel={handleUploadCancel}
          isUploading={isUploading}
        />
      )}
    </>
  );
}
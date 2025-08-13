'use client';

import { useState } from 'react';
import { X, Upload, FileAudio, Clock } from 'lucide-react';
import AdvancedOptions from './AdvancedOptions';
import { TranscriptionModel } from './ModelSelection';
import styles from './PreviewDialog.module.css';

interface PreviewDialogProps {
  file: File;
  onConfirm: (data: {
    whisperPrompt?: string;
    transcriptionModel: TranscriptionModel;
    geminiSystemPrompt?: string;
    geminiUserPrompt?: string;
  }) => void;
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
  const [selectedModel, setSelectedModel] = useState<TranscriptionModel>('gpt-4o-transcribe');
  const [geminiPrompt, setGeminiPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>();

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

        {/* Advanced Options (Multi-Model Transcription) */}
        <AdvancedOptions
          whisperPrompt={whisperPrompt}
          onWhisperPromptChange={setWhisperPrompt}
          isExpanded={showAdvancedOptions}
          onToggle={() => setShowAdvancedOptions(!showAdvancedOptions)}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          geminiPrompt={geminiPrompt}
          onGeminiPromptChange={setGeminiPrompt}
          selectedTemplate={selectedTemplate}
          onTemplateSelect={setSelectedTemplate}
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
            onClick={() => {
              // Parse Gemini prompts if that model is selected
              let geminiSystemPrompt: string | undefined;
              let geminiUserPrompt: string | undefined;
              
              if (selectedModel === 'google/gemini-2.0-flash-001' && geminiPrompt) {
                // For now, use the entire prompt as user prompt
                // In production, we'd parse templates to extract system prompt
                geminiUserPrompt = geminiPrompt;
                geminiSystemPrompt = "You are a professional transcriber. Focus on accuracy and completeness.";
              }
              
              onConfirm({
                whisperPrompt: selectedModel === 'gpt-4o-transcribe' ? whisperPrompt || undefined : undefined,
                transcriptionModel: selectedModel,
                geminiSystemPrompt,
                geminiUserPrompt
              });
            }}
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
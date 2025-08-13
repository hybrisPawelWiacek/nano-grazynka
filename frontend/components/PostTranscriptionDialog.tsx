import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, X, AlertCircle } from 'lucide-react';
import { regenerateSummary } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import styles from './PostTranscriptionDialog.module.css';

interface PostTranscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transcriptionText: string;
  noteId: string;
  onSummaryGenerated: (summaryPrompt: string) => void;
}

const SUMMARY_TEMPLATE = `=== SUMMARY INSTRUCTIONS ===
Focus on:
- Key decisions and conclusions
- Action items with owners
- Technical details discussed
- Next steps and deadlines

Additional requirements: [customize here]`;

export default function PostTranscriptionDialog({
  isOpen,
  onClose,
  transcriptionText,
  noteId,
  onSummaryGenerated
}: PostTranscriptionDialogProps) {
  const { anonymousSessionId } = useAuth();
  const [summaryPrompt, setSummaryPrompt] = useState(SUMMARY_TEMPLATE);
  const [templateModified, setTemplateModified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Character and word count for transcription
  const wordCount = transcriptionText.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = transcriptionText.length;
  
  useEffect(() => {
    // Check if the prompt has been modified from template
    const isModified = summaryPrompt !== SUMMARY_TEMPLATE && summaryPrompt !== '';
    setTemplateModified(isModified);
  }, [summaryPrompt]);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      // Only send the prompt if it's been modified
      const promptToSend = templateModified ? summaryPrompt : '';
      
      // Call the API to regenerate summary
      const result = await regenerateSummary(
        noteId,
        promptToSend || undefined,
        anonymousSessionId || undefined
      );
      
      if (result.success) {
        onSummaryGenerated(promptToSend);
      } else {
        console.error('Failed to generate summary:', result.error);
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSummaryPrompt(SUMMARY_TEMPLATE);
    setTemplateModified(false);
  };

  if (!isOpen) return null;
  
  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <FileText className={styles.headerIcon} />
            <h2 className={styles.title}>Transcription Complete</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={styles.closeButton}
            aria-label="Skip summary generation"
          >
            <X className={styles.buttonIcon} />
          </button>
        </div>

        {/* Transcription Display */}
        <div className={styles.transcriptionSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Transcribed Text</h3>
            <div className={styles.stats}>
              <span className={styles.stat}>{wordCount.toLocaleString()} words</span>
              <span className={styles.statSeparator}>•</span>
              <span className={styles.stat}>{charCount.toLocaleString()} characters</span>
            </div>
          </div>
          
          <div className={styles.transcriptionBox}>
            <div className={styles.transcriptionText}>
              {transcriptionText}
            </div>
          </div>
        </div>

        {/* Summary Prompt Section */}
        <div className={styles.promptSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Sparkles className={styles.sparklesIcon} />
              Customize Summary Instructions
            </h3>
            {templateModified && (
              <button
                type="button"
                onClick={handleReset}
                className={styles.resetButton}
                disabled={isLoading}
              >
                Reset to template
              </button>
            )}
          </div>
          
          <textarea
            value={summaryPrompt}
            onChange={(e) => setSummaryPrompt(e.target.value)}
            className={styles.promptTextarea}
            placeholder="Enter instructions for how you want the summary to be generated..."
            rows={8}
            disabled={isLoading}
          />
          
          <div className={styles.helperText}>
            {templateModified ? (
              <span className={styles.modifiedIndicator}>
                <AlertCircle className={styles.modifiedIcon} />
                Custom instructions will be used
              </span>
            ) : (
              <span className={styles.defaultIndicator}>
                Using default template
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={styles.skipButton}
          >
            Skip Summary
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={styles.confirmButton}
          >
            {isLoading ? (
              <>
                <span className={styles.loadingSpinner} />
                Generating Summary...
              </>
            ) : (
              <>
                <Sparkles className={styles.buttonIcon} />
                Generate Summary
              </>
            )}
          </button>
        </div>

        {/* Info Note */}
        <div className={styles.infoNote}>
          <p className={styles.infoText}>
            The AI will create a structured summary based on your instructions. 
            You can skip this step and generate a summary later if needed.
          </p>
        </div>
      </div>
    </div>
  );
}
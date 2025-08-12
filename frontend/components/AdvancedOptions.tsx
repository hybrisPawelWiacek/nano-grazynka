import React from 'react';
import { ChevronDown, Info } from 'lucide-react';
import styles from './AdvancedOptions.module.css';

interface AdvancedOptionsProps {
  whisperPrompt: string;
  onWhisperPromptChange: (value: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function AdvancedOptions({
  whisperPrompt,
  onWhisperPromptChange,
  isExpanded,
  onToggle
}: AdvancedOptionsProps) {
  const MAX_TOKENS = 224;
  
  // Rough token estimation (1 token ≈ 4 characters)
  const estimatedTokens = Math.ceil(whisperPrompt.length / 4);
  const isNearLimit = estimatedTokens > MAX_TOKENS * 0.8;
  const isOverLimit = estimatedTokens > MAX_TOKENS;

  return (
    <div className={styles.container}>
      <button 
        type="button"
        onClick={onToggle}
        className={styles.toggleButton}
        aria-expanded={isExpanded}
        aria-controls="advanced-options-content"
      >
        <span className={styles.toggleLabel}>Advanced Options</span>
        <ChevronDown 
          className={`${styles.toggleIcon} ${isExpanded ? styles.expanded : ''}`}
        />
      </button>

      <div 
        id="advanced-options-content"
        className={`${styles.content} ${isExpanded ? styles.contentExpanded : ''}`}
        aria-hidden={!isExpanded}
      >
        <div className={styles.section}>
          <div className={styles.labelContainer}>
            <label htmlFor="whisper-prompt" className={styles.label}>
              Transcription Hints (Optional)
            </label>
            <div className={styles.tooltip}>
              <Info className={styles.infoIcon} />
              <div className={styles.tooltipContent}>
                Help Whisper recognize proper nouns, technical terms, and acronyms correctly.
                These hints improve transcription accuracy but don't affect the summary.
              </div>
            </div>
          </div>
          
          <textarea
            id="whisper-prompt"
            value={whisperPrompt}
            onChange={(e) => onWhisperPromptChange(e.target.value)}
            className={`${styles.textarea} ${isOverLimit ? styles.textareaError : ''}`}
            placeholder="Example: Company names: Zabu, nano-Grazynka | Technical terms: MCP, PRD, DDD | People: John Smith (CEO), Maria Garcia (CTO)"
            rows={3}
          />
          
          <div className={styles.helperText}>
            <span className={`${styles.charCount} ${isNearLimit ? styles.charCountWarning : ''} ${isOverLimit ? styles.charCountError : ''}`}>
              ~{estimatedTokens} / {MAX_TOKENS} tokens
            </span>
            {isOverLimit && (
              <span className={styles.errorText}>
                Exceeds token limit. Please shorten your hints.
              </span>
            )}
          </div>

          <div className={styles.examples}>
            <p className={styles.examplesTitle}>Examples of what to include:</p>
            <ul className={styles.examplesList}>
              <li>Company or product names that might be misheard</li>
              <li>Technical acronyms and domain-specific terms</li>
              <li>Names of people mentioned in the recording</li>
              <li>Unusual spellings or pronunciations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
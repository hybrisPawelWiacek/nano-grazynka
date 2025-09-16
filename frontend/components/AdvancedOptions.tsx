import React from 'react';
import { TranscriptionModel } from '../hooks/useTranscriptionModel';
import styles from './AdvancedOptions.module.css';

interface AdvancedOptionsProps {
  whisperPrompt: string;
  onWhisperPromptChange: (value: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
  selectedModel: TranscriptionModel;
  onModelChange: (model: TranscriptionModel) => void;
  geminiPrompt: string;
  onGeminiPromptChange: (value: string) => void;
  selectedTemplate?: string;
  onTemplateSelect: (template: string | undefined) => void;
}

export default function AdvancedOptions({
  whisperPrompt,
  onWhisperPromptChange,
  isExpanded,
  onToggle,
  selectedModel,
  onModelChange,
  geminiPrompt,
  onGeminiPromptChange,
  selectedTemplate,
  onTemplateSelect
}: AdvancedOptionsProps) {
  // Don't render anything if not expanded
  if (!isExpanded) return null;

  const isGemini = selectedModel === 'google/gemini-2.0-flash-001';
  
  return (
    <div className={styles.minimalContainer}>
      <textarea
        className={styles.minimalTextarea}
        placeholder={
          isGemini 
            ? "Add context: speaker names, technical terms, special instructions..."
            : "Add quick hints: names, acronyms (max 200 chars)"
        }
        value={isGemini ? geminiPrompt : whisperPrompt}
        onChange={(e) => 
          isGemini 
            ? onGeminiPromptChange(e.target.value)
            : onWhisperPromptChange(e.target.value)
        }
        rows={isGemini ? 4 : 2}
        maxLength={!isGemini ? 200 : undefined}
      />
    </div>
  );
}
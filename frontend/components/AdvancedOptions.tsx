import React from 'react';
import styles from './AdvancedOptions.module.css';

interface AdvancedOptionsProps {
  whisperPrompt: string;
  onWhisperPromptChange: (value: string) => void;
  selectedModel: string;
  geminiPrompt: string;
  onGeminiPromptChange: (value: string) => void;
  showOptions: boolean; // Only show when file is selected
}

export default function AdvancedOptions({
  whisperPrompt,
  onWhisperPromptChange,
  selectedModel,
  geminiPrompt,
  onGeminiPromptChange,
  showOptions
}: AdvancedOptionsProps) {
  // Don't render anything if no file is selected
  if (!showOptions) return null;

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
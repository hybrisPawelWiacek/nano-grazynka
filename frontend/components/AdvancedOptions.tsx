import React, { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import styles from './AdvancedOptions.module.css';
import ModelSelection, { TranscriptionModel } from './ModelSelection';
import TemplateSelector from './TemplateSelector';
import TokenCounter from './TokenCounter';

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
  onTemplateSelect?: (templateKey: string) => void;
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
  const MAX_TOKENS_GPT = 224;
  const MAX_TOKENS_GEMINI = 1000000;
  
  // Rough token estimation (1 token ≈ 4 characters)
  const estimatedTokensGPT = Math.ceil(whisperPrompt.length / 4);
  const estimatedTokensGemini = Math.ceil(geminiPrompt.length / 4);
  
  const isNearLimitGPT = estimatedTokensGPT > MAX_TOKENS_GPT * 0.8;
  const isOverLimitGPT = estimatedTokensGPT > MAX_TOKENS_GPT;

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
        {/* Model Selection */}
        <ModelSelection
          selectedModel={selectedModel}
          onModelChange={onModelChange}
        />

        {/* Adaptive Prompt Interface */}
        <div className={styles.section}>
          {selectedModel === 'gpt-4o-transcribe' ? (
            // GPT-4o Simple Prompt Interface
            <>
              <div className={styles.labelContainer}>
                <label htmlFor="whisper-prompt" className={styles.label}>
                  Transcription Hints (Optional)
                </label>
                <div className={styles.tooltip}>
                  <Info className={styles.infoIcon} />
                  <div className={styles.tooltipContent}>
                    Help GPT-4o recognize proper nouns, technical terms, and acronyms correctly.
                    Limited to 224 tokens for fast processing.
                  </div>
                </div>
              </div>
              
              <textarea
                id="whisper-prompt"
                value={whisperPrompt}
                onChange={(e) => onWhisperPromptChange(e.target.value)}
                className={`${styles.textarea} ${isOverLimitGPT ? styles.textareaError : ''}`}
                placeholder="Example: Company names: Zabu, nano-Grazynka | Technical terms: MCP, PRD, DDD | People: John Smith (CEO)"
                rows={3}
              />
              
              <TokenCounter
                current={estimatedTokensGPT}
                max={MAX_TOKENS_GPT}
                isNearLimit={isNearLimitGPT}
                isOverLimit={isOverLimitGPT}
              />
            </>
          ) : (
            // Gemini Extended Context Interface
            <>
              <div className={styles.labelContainer}>
                <label htmlFor="gemini-prompt" className={styles.label}>
                  Context & Instructions (Extended)
                </label>
                <div className={styles.tooltip}>
                  <Info className={styles.infoIcon} />
                  <div className={styles.tooltipContent}>
                    Provide extensive context, glossaries, meeting agendas, or specific instructions.
                    Gemini can handle up to 1 million tokens for rich context understanding.
                  </div>
                </div>
              </div>

              {/* Template Selector */}
              {onTemplateSelect && (
                <TemplateSelector
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={onTemplateSelect}
                />
              )}
              
              <textarea
                id="gemini-prompt"
                value={geminiPrompt}
                onChange={(e) => onGeminiPromptChange(e.target.value)}
                className={styles.textareaLarge}
                placeholder={getGeminiPlaceholder(selectedTemplate)}
                rows={12}
              />
              
              <TokenCounter
                current={estimatedTokensGemini}
                max={MAX_TOKENS_GEMINI}
                showPercentage={true}
              />

              <div className={styles.geminiFeatures}>
                <p className={styles.featuresTitle}>What you can include:</p>
                <ul className={styles.featuresList}>
                  <li>📋 Complete meeting agendas and attendee lists</li>
                  <li>📚 Company glossaries and technical terminology</li>
                  <li>🎯 Specific formatting instructions</li>
                  <li>📝 Previous meeting notes for context</li>
                  <li>🏢 Organization structure and project details</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getGeminiPlaceholder(template?: string): string {
  if (!template) {
    return `Provide context for accurate transcription:

=== CONTEXT ===
Company/Project: 
Speakers: 
Technical terms: 

=== INSTRUCTIONS ===
1. Identify speakers clearly
2. Mark important decisions
3. Note action items
4. Flag unclear audio`;
  }

  switch (template) {
    case 'meeting':
      return `=== MEETING CONTEXT ===
Date: 
Attendees: 
Agenda: 

=== COMPANY GLOSSARY ===
Company: 
Projects: 
Technical terms: 

=== SPECIAL INSTRUCTIONS ===
(Add any specific requirements)`;

    case 'technical':
      return `=== TECHNICAL CONTEXT ===
Domain: 
Technologies: 
Codebase: 

=== TERMINOLOGY ===
Frameworks: 
Libraries: 
Common variables: 

=== INSTRUCTIONS ===
Preserve code snippets exactly...`;

    case 'podcast':
      return `=== SHOW INFORMATION ===
Show: 
Host(s): 
Guest(s): 
Topic: 

=== STYLE GUIDE ===
Include timestamps, laughter, pauses...`;

    default:
      return '';
  }
}
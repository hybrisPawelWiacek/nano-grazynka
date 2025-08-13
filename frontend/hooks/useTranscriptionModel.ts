import { useState, useCallback, useMemo } from 'react';

export type TranscriptionModel = 'gpt-4o-transcribe' | 'google/gemini-2.0-flash-001';

interface ModelConfig {
  name: string;
  badge: string;
  description: string;
  features: string[];
  maxPromptTokens: number;
  costPerMinute: number;
  processingTime: string;
  supportsTemplates: boolean;
}

const MODEL_CONFIGS: Record<TranscriptionModel, ModelConfig> = {
  'gpt-4o-transcribe': {
    name: 'GPT-4o Transcribe',
    badge: 'Fast',
    description: 'Best for quick, simple transcriptions',
    features: [
      '5-10 second processing',
      '224 token prompt limit',
      '$0.006/minute'
    ],
    maxPromptTokens: 224,
    costPerMinute: 0.006,
    processingTime: '5-10 seconds',
    supportsTemplates: false
  },
  'google/gemini-2.0-flash-001': {
    name: 'Gemini 2.0 Flash',
    badge: 'Extended Context',
    description: 'Best for complex, context-heavy audio',
    features: [
      '10-20 second processing',
      '1M token prompt capacity',
      '$0.0015/minute (75% cheaper)'
    ],
    maxPromptTokens: 1000000,
    costPerMinute: 0.0015,
    processingTime: '10-20 seconds',
    supportsTemplates: true
  }
};

export interface TranscriptionModelState {
  selectedModel: TranscriptionModel;
  whisperPrompt: string;
  geminiSystemPrompt: string;
  geminiUserPrompt: string;
  selectedTemplate: string | null;
  templateVariables: Record<string, string>;
}

export function useTranscriptionModel(initialModel: TranscriptionModel = 'gpt-4o-transcribe') {
  const [selectedModel, setSelectedModel] = useState<TranscriptionModel>(initialModel);
  const [whisperPrompt, setWhisperPrompt] = useState('');
  const [geminiSystemPrompt, setGeminiSystemPrompt] = useState('');
  const [geminiUserPrompt, setGeminiUserPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});

  const modelConfig = useMemo(() => MODEL_CONFIGS[selectedModel], [selectedModel]);

  const isGeminiModel = selectedModel === 'google/gemini-2.0-flash-001';
  const isGPTModel = selectedModel === 'gpt-4o-transcribe';

  const tokenCount = useMemo(() => {
    if (isGPTModel) {
      return Math.ceil(whisperPrompt.length / 4); // Rough estimate: 1 token ≈ 4 chars
    } else {
      const fullPrompt = geminiSystemPrompt + geminiUserPrompt;
      return Math.ceil(fullPrompt.length / 4);
    }
  }, [isGPTModel, whisperPrompt, geminiSystemPrompt, geminiUserPrompt]);

  const costEstimate = useCallback((durationMinutes: number) => {
    return durationMinutes * modelConfig.costPerMinute;
  }, [modelConfig]);

  const savingsPercentage = useMemo(() => {
    if (isGeminiModel) {
      const gptCost = MODEL_CONFIGS['gpt-4o-transcribe'].costPerMinute;
      const geminiCost = MODEL_CONFIGS['google/gemini-2.0-flash-001'].costPerMinute;
      return Math.round(((gptCost - geminiCost) / gptCost) * 100);
    }
    return 0;
  }, [isGeminiModel]);

  const resetPrompts = useCallback(() => {
    setWhisperPrompt('');
    setGeminiSystemPrompt('');
    setGeminiUserPrompt('');
    setSelectedTemplate(null);
    setTemplateVariables({});
  }, []);

  const switchModel = useCallback((model: TranscriptionModel) => {
    setSelectedModel(model);
    resetPrompts();
  }, [resetPrompts]);

  const applyTemplate = useCallback((templateName: string, systemPrompt: string, userPrompt: string) => {
    setSelectedTemplate(templateName);
    setGeminiSystemPrompt(systemPrompt);
    setGeminiUserPrompt(userPrompt);
  }, []);

  const updateTemplateVariable = useCallback((key: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const getPromptForModel = useCallback(() => {
    if (isGPTModel) {
      return whisperPrompt;
    } else {
      // Apply template variables to user prompt
      let processedPrompt = geminiUserPrompt;
      Object.entries(templateVariables).forEach(([key, value]) => {
        processedPrompt = processedPrompt.replace(new RegExp(`{${key}}`, 'g'), value);
      });
      return processedPrompt;
    }
  }, [isGPTModel, whisperPrompt, geminiUserPrompt, templateVariables]);

  const isPromptValid = useCallback(() => {
    if (isGPTModel) {
      return tokenCount <= modelConfig.maxPromptTokens;
    } else {
      // For Gemini, also check if all template variables are filled
      if (selectedTemplate) {
        const placeholders = geminiUserPrompt.match(/{(\w+)}/g) || [];
        const uniquePlaceholders = [...new Set(placeholders.map(p => p.slice(1, -1)))];
        return uniquePlaceholders.every(placeholder => 
          templateVariables[placeholder] && templateVariables[placeholder].trim() !== ''
        ) && tokenCount <= modelConfig.maxPromptTokens;
      }
      return tokenCount <= modelConfig.maxPromptTokens;
    }
  }, [isGPTModel, tokenCount, modelConfig.maxPromptTokens, selectedTemplate, geminiUserPrompt, templateVariables]);

  return {
    // State
    selectedModel,
    whisperPrompt,
    geminiSystemPrompt,
    geminiUserPrompt,
    selectedTemplate,
    templateVariables,
    
    // Setters
    setSelectedModel: switchModel,
    setWhisperPrompt,
    setGeminiSystemPrompt,
    setGeminiUserPrompt,
    setSelectedTemplate,
    setTemplateVariables,
    updateTemplateVariable,
    
    // Computed values
    modelConfig,
    isGeminiModel,
    isGPTModel,
    tokenCount,
    savingsPercentage,
    
    // Helper functions
    costEstimate,
    resetPrompts,
    applyTemplate,
    getPromptForModel,
    isPromptValid,
    
    // Constants
    MODEL_CONFIGS
  };
}
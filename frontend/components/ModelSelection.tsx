import React from 'react';
import styles from './ModelSelection.module.css';

export type TranscriptionModel = 'gpt-4o-transcribe' | 'google/gemini-2.0-flash-001';

interface ModelSelectionProps {
  selectedModel: TranscriptionModel;
  onModelChange: (model: TranscriptionModel) => void;
}

const ModelSelection: React.FC<ModelSelectionProps> = ({ selectedModel, onModelChange }) => {
  return (
    <div className={styles.modelSelection}>
      <h3 className={styles.title}>Choose Transcription Model</h3>
      
      <div className={styles.modelCards}>
        <label className={`${styles.modelCard} ${selectedModel === 'gpt-4o-transcribe' ? styles.selected : ''}`}>
          <input
            type="radio"
            name="transcriptionModel"
            value="gpt-4o-transcribe"
            checked={selectedModel === 'gpt-4o-transcribe'}
            onChange={(e) => onModelChange(e.target.value as TranscriptionModel)}
            className={styles.radioInput}
          />
          <div className={styles.modelInfo}>
            <div className={styles.modelHeader}>
              <h4>GPT-4o Transcribe</h4>
              <span className={`${styles.badge} ${styles.fast}`}>Fast</span>
            </div>
            <p className={styles.description}>Best for quick, simple transcriptions</p>
            <ul className={styles.features}>
              <li>⚡ 5-10 second processing</li>
              <li>📝 224 token prompt limit</li>
              <li>💵 $0.006/minute</li>
              <li>✅ High accuracy</li>
            </ul>
          </div>
        </label>
        
        <label className={`${styles.modelCard} ${selectedModel === 'google/gemini-2.0-flash-001' ? styles.selected : ''}`}>
          <input
            type="radio"
            name="transcriptionModel"
            value="google/gemini-2.0-flash-001"
            checked={selectedModel === 'google/gemini-2.0-flash-001'}
            onChange={(e) => onModelChange(e.target.value as TranscriptionModel)}
            className={styles.radioInput}
          />
          <div className={styles.modelInfo}>
            <div className={styles.modelHeader}>
              <h4>Gemini 2.0 Flash</h4>
              <span className={`${styles.badge} ${styles.extended}`}>Extended Context</span>
            </div>
            <p className={styles.description}>Best for complex, context-heavy audio</p>
            <ul className={styles.features}>
              <li>🧠 1M token prompt capacity</li>
              <li>⏱️ 10-20 second processing</li>
              <li>💰 $0.0015/minute (75% cheaper)</li>
              <li>📋 Template support</li>
            </ul>
          </div>
        </label>
      </div>
      
      <div className={styles.recommendation}>
        {selectedModel === 'gpt-4o-transcribe' ? (
          <p>💡 <strong>Recommended for:</strong> Short recordings, quick notes, general transcription</p>
        ) : (
          <p>💡 <strong>Recommended for:</strong> Meetings, technical discussions, interviews with specific terminology</p>
        )}
      </div>
    </div>
  );
};

export default ModelSelection;
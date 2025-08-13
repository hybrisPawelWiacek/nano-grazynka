import React, { useMemo } from 'react';
import styles from './CostEstimator.module.css';

interface CostEstimatorProps {
  model: 'gpt-4o-transcribe' | 'google/gemini-2.0-flash-001';
  durationMinutes?: number;
  showSavings?: boolean;
  className?: string;
}

const MODEL_COSTS = {
  'gpt-4o-transcribe': 0.006,      // $0.006 per minute
  'google/gemini-2.0-flash-001': 0.0015  // $0.0015 per minute
};

export default function CostEstimator({ 
  model, 
  durationMinutes = 1, 
  showSavings = true,
  className = ''
}: CostEstimatorProps) {
  
  const cost = useMemo(() => {
    return MODEL_COSTS[model] * durationMinutes;
  }, [model, durationMinutes]);

  const savings = useMemo(() => {
    if (model === 'google/gemini-2.0-flash-001') {
      const gptCost = MODEL_COSTS['gpt-4o-transcribe'] * durationMinutes;
      const geminiCost = cost;
      return {
        amount: gptCost - geminiCost,
        percentage: Math.round(((gptCost - geminiCost) / gptCost) * 100)
      };
    }
    return null;
  }, [model, cost, durationMinutes]);

  const formatCost = (amount: number) => {
    if (amount < 0.01) {
      return `$${(amount * 100).toFixed(2)}¢`;
    }
    return `$${amount.toFixed(3)}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 1) {
      return `${Math.round(minutes * 60)} seconds`;
    }
    if (minutes === 1) {
      return '1 minute';
    }
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours}h ${mins}m`;
  };

  return (
    <div className={`${styles.costEstimator} ${className}`}>
      <div className={styles.costMain}>
        <span className={styles.costLabel}>Estimated cost:</span>
        <span className={styles.costAmount}>{formatCost(cost)}</span>
        <span className={styles.costDuration}>for {formatDuration(durationMinutes)}</span>
      </div>
      
      {showSavings && savings && (
        <div className={styles.savingsContainer}>
          <div className={styles.savingsBadge}>
            <svg 
              className={styles.savingsIcon} 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className={styles.savingsText}>
              Save {savings.percentage}%
            </span>
          </div>
          <span className={styles.savingsAmount}>
            ({formatCost(savings.amount)} less than GPT-4o)
          </span>
        </div>
      )}
      
      <div className={styles.costBreakdown}>
        <div className={styles.costPerMinute}>
          <span className={styles.rateLabel}>Rate:</span>
          <span className={styles.rateAmount}>{formatCost(MODEL_COSTS[model])}/min</span>
        </div>
        {model === 'google/gemini-2.0-flash-001' && (
          <div className={styles.comparisonNote}>
            <span className={styles.vsGPT}>vs GPT-4o: {formatCost(MODEL_COSTS['gpt-4o-transcribe'])}/min</span>
          </div>
        )}
      </div>
    </div>
  );
}
import React from 'react';
import styles from './TokenCounter.module.css';

interface TokenCounterProps {
  current: number;
  max: number;
  isNearLimit?: boolean;
  isOverLimit?: boolean;
  showPercentage?: boolean;
}

const TokenCounter: React.FC<TokenCounterProps> = ({
  current,
  max,
  isNearLimit = false,
  isOverLimit = false,
  showPercentage = false
}) => {
  const percentage = (current / max) * 100;
  const isLargeNumber = max > 10000;

  const formatNumber = (num: number): string => {
    if (isLargeNumber && num > 1000) {
      return `${(num / 1000).toFixed(0)}k`;
    }
    return num.toLocaleString();
  };

  return (
    <div className={styles.container}>
      <div className={styles.counter}>
        <span className={`${styles.count} ${isNearLimit ? styles.warning : ''} ${isOverLimit ? styles.error : ''}`}>
          ~{formatNumber(current)} / {formatNumber(max)} tokens
        </span>
        {showPercentage && percentage < 10 && (
          <span className={styles.percentage}>({percentage.toFixed(2)}%)</span>
        )}
      </div>
      
      {!isOverLimit && max > 1000 && (
        <div className={styles.progressBar}>
          <div 
            className={`${styles.progressFill} ${isNearLimit ? styles.progressWarning : ''}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
      
      {isOverLimit && (
        <div className={styles.errorMessage}>
          Exceeds token limit. Please shorten your input.
        </div>
      )}
    </div>
  );
};

export default TokenCounter;
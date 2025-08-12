/**
 * Anonymous Session Management
 * Handles sessionId generation and usage tracking for non-authenticated users
 */

/**
 * Generate or retrieve existing anonymous session ID
 */
export const getOrCreateSessionId = (): string => {
  if (typeof window === 'undefined') {
    // Server-side rendering, return empty string
    return '';
  }
  
  let sessionId = localStorage.getItem('anonymousSessionId');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('anonymousSessionId', sessionId);
    localStorage.setItem('anonymousUsageCount', '0');
  }
  return sessionId;
};

/**
 * Increment and return the new usage count
 */
export const incrementUsageCount = (): number => {
  if (typeof window === 'undefined') {
    return 0;
  }
  
  const count = parseInt(localStorage.getItem('anonymousUsageCount') || '0');
  const newCount = count + 1;
  localStorage.setItem('anonymousUsageCount', String(newCount));
  return newCount;
};

/**
 * Get current usage count
 */
export const getUsageCount = (): number => {
  if (typeof window === 'undefined') {
    return 0;
  }
  
  return parseInt(localStorage.getItem('anonymousUsageCount') || '0');
};

/**
 * Get remaining free transcriptions
 */
export const getRemainingUsage = (): number => {
  const ANONYMOUS_USAGE_LIMIT = 5;
  return Math.max(0, ANONYMOUS_USAGE_LIMIT - getUsageCount());
};

/**
 * Check if user has reached the usage limit
 */
export const hasReachedLimit = (): boolean => {
  const ANONYMOUS_USAGE_LIMIT = 5;
  return getUsageCount() >= ANONYMOUS_USAGE_LIMIT;
};

/**
 * Clear anonymous session data (used after user signs up)
 */
export const clearAnonymousSession = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem('anonymousSessionId');
  localStorage.removeItem('anonymousUsageCount');
};

/**
 * Migrate anonymous session to authenticated user
 * Returns the sessionId that should be sent to backend for migration
 */
export const getSessionIdForMigration = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  return localStorage.getItem('anonymousSessionId');
};

// Constants
export const ANONYMOUS_USAGE_LIMIT = 5;
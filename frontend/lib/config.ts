// Configuration for frontend application

export const config = {
  // API configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101',
    timeout: 30000, // 30 seconds
  },
  
  // File upload configuration
  upload: {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    allowedFormats: ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.mp4', '.mpeg', '.mpga'],
    allowedMimeTypes: [
      'audio/mpeg',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/mp4',
      'audio/x-m4a',
      'audio/ogg',
      'audio/webm',
      'video/mp4', // Some voice recordings come as mp4
      'video/webm',
    ],
  },
  
  // Polling configuration for processing status
  polling: {
    interval: 2000, // 2 seconds
    maxAttempts: 150, // 5 minutes max
  },
  
  // UI configuration
  ui: {
    itemsPerPage: 20,
    debounceDelay: 300, // milliseconds
    toastDuration: 5000, // milliseconds
  },
  
  // Feature flags
  features: {
    enableKeyboardShortcuts: true,
    enableDarkMode: false, // MVP is light theme only
    enableBatchUpload: false, // Not in MVP
  },
} as const;

// Type helper for config
export type Config = typeof config;
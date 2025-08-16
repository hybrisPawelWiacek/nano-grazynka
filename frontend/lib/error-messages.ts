// User-friendly error messages with actionable suggestions

interface ErrorMessageConfig {
  title: string;
  description: string;
  suggestion?: string;
}

const errorMappings: Record<string, ErrorMessageConfig> = {
  // Network errors
  'fetch': {
    title: 'Connection Error',
    description: 'Unable to connect to the server',
    suggestion: 'Please check your internet connection and try again'
  },
  'network': {
    title: 'Network Error',
    description: 'A network error occurred',
    suggestion: 'Please check your connection and try again'
  },
  'ECONNREFUSED': {
    title: 'Server Unavailable',
    description: 'Cannot reach the server',
    suggestion: 'The server may be down. Please try again later'
  },
  
  // Authentication errors
  '401': {
    title: 'Authentication Required',
    description: 'You need to be logged in to perform this action',
    suggestion: 'Please log in and try again'
  },
  'unauthorized': {
    title: 'Access Denied',
    description: 'You don\'t have permission to access this resource',
    suggestion: 'Please log in with an account that has the necessary permissions'
  },
  
  // File errors
  'file too large': {
    title: 'File Too Large',
    description: 'The file exceeds the maximum size limit',
    suggestion: 'Please select a smaller file (max 25MB)'
  },
  'unsupported format': {
    title: 'Unsupported File Type',
    description: 'This file format is not supported',
    suggestion: 'Please upload an audio file (MP3, M4A, WAV, or WebM)'
  },
  'no file': {
    title: 'No File Selected',
    description: 'Please select a file to upload',
    suggestion: 'Click the upload area to select an audio file'
  },
  
  // Processing errors
  'transcription failed': {
    title: 'Transcription Failed',
    description: 'Unable to transcribe the audio file',
    suggestion: 'Please ensure the audio is clear and try again'
  },
  'summary failed': {
    title: 'Summary Generation Failed',
    description: 'Unable to generate a summary',
    suggestion: 'Try regenerating with a different prompt or model'
  },
  'processing timeout': {
    title: 'Processing Timeout',
    description: 'The operation took too long to complete',
    suggestion: 'Please try again with a shorter audio file'
  },
  
  // Quota errors
  'usage limit': {
    title: 'Usage Limit Reached',
    description: 'You\'ve reached your free usage limit',
    suggestion: 'Sign up for an account to continue using the service'
  },
  'rate limit': {
    title: 'Too Many Requests',
    description: 'You\'re making requests too quickly',
    suggestion: 'Please wait a moment before trying again'
  },
  
  // Server errors
  '500': {
    title: 'Server Error',
    description: 'An error occurred on our servers',
    suggestion: 'Our team has been notified. Please try again later'
  },
  '503': {
    title: 'Service Unavailable',
    description: 'The service is temporarily unavailable',
    suggestion: 'Please try again in a few minutes'
  },
  
  // API errors
  'api key': {
    title: 'Configuration Error',
    description: 'API configuration issue detected',
    suggestion: 'Please contact support if this persists'
  },
  'model not available': {
    title: 'Model Unavailable',
    description: 'The selected AI model is not available',
    suggestion: 'Try switching to a different model'
  },
  
  // Default fallback
  'default': {
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred',
    suggestion: 'Please try again. If the problem persists, contact support'
  }
};

export function getUserFriendlyError(error: any): ErrorMessageConfig {
  // Convert error to string for matching
  const errorString = error?.message?.toLowerCase() || 
                      error?.toString?.()?.toLowerCase() || 
                      '';
  
  // Check status code if it's a response error
  if (error?.status) {
    const statusConfig = errorMappings[error.status.toString()];
    if (statusConfig) return statusConfig;
  }
  
  // Check for specific error patterns
  for (const [pattern, config] of Object.entries(errorMappings)) {
    if (pattern === 'default') continue;
    
    if (errorString.includes(pattern.toLowerCase())) {
      return config;
    }
  }
  
  // Check for common HTTP status codes in the message
  if (errorString.includes('401') || errorString.includes('unauthorized')) {
    return errorMappings['401'];
  }
  if (errorString.includes('500') || errorString.includes('internal server')) {
    return errorMappings['500'];
  }
  if (errorString.includes('503') || errorString.includes('unavailable')) {
    return errorMappings['503'];
  }
  
  // Return default error
  return errorMappings['default'];
}

export function formatErrorForToast(error: any): string {
  const { title, description, suggestion } = getUserFriendlyError(error);
  
  // For toast, combine title and suggestion for brevity
  if (suggestion) {
    return `${title}: ${suggestion}`;
  }
  return `${title}: ${description}`;
}

export function formatErrorForDisplay(error: any): {
  title: string;
  message: string;
} {
  const { title, description, suggestion } = getUserFriendlyError(error);
  
  let message = description;
  if (suggestion) {
    message += `. ${suggestion}`;
  }
  
  return { title, message };
}
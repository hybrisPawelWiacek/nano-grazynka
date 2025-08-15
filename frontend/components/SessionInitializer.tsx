'use client';

import { useEffect } from 'react';
import { getOrCreateSessionId } from '@/lib/anonymousSession';

export default function SessionInitializer() {
  useEffect(() => {
    // Initialize session immediately on mount
    // This runs before AuthContext and ensures session is ready
    if (typeof window !== 'undefined') {
      getOrCreateSessionId();
    }
  }, []);

  return null; // This component doesn't render anything
}
'use client';

import { useEffect } from 'react';
import { setupApiInterceptor } from '@/lib/api-interceptor';

export default function ApiInterceptorSetup() {
  useEffect(() => {
    // Set up the global API interceptor
    setupApiInterceptor();
    
    // Cleanup is not needed as this is a global setup
    // The interceptor will remain active for the entire app lifecycle
  }, []);

  // This component doesn't render anything
  return null;
}
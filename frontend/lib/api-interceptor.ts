// Global API interceptor for handling 401 errors
import { clearAuthCookie } from './auth-helpers';

// Store the original fetch
const originalFetch = global.fetch;

// Flag to prevent infinite loops
let isHandling401 = false;

/**
 * Global fetch interceptor that handles 401 errors
 * Automatically clears invalid tokens and redirects to login
 */
export function setupApiInterceptor() {
  global.fetch = async (...args) => {
    const [input, init] = args;
    
    // Always include credentials for API calls
    const modifiedInit = {
      ...init,
      credentials: 'include' as RequestCredentials,
    };

    try {
      const response = await originalFetch(input, modifiedInit);
      
      // Handle 401 Unauthorized globally
      if (response.status === 401 && !isHandling401) {
        isHandling401 = true;
        
        console.log('Global 401 handler: Invalid token detected');
        
        // Don't try to clear cookie if we're already on auth endpoints
        const url = typeof input === 'string' ? input : input.url;
        const isAuthEndpoint = url.includes('/auth/login') || 
                               url.includes('/auth/register') || 
                               url.includes('/auth/logout') ||
                               url.includes('/auth/me');
        
        if (!isAuthEndpoint) {
          try {
            // Clear the invalid auth cookie
            await clearAuthCookie();
            console.log('Global 401 handler: Cleared invalid token');
            
            // Only redirect if we're not already on an auth page
            if (typeof window !== 'undefined') {
              const currentPath = window.location.pathname;
              const isOnAuthPage = currentPath === '/login' || 
                                  currentPath === '/register';
              
              if (!isOnAuthPage) {
                // Store the current location for redirect after login
                sessionStorage.setItem('redirectAfterLogin', currentPath);
                window.location.href = '/login?session=expired';
              }
            }
          } catch (error) {
            console.error('Global 401 handler: Failed to clear token', error);
          }
        }
        
        isHandling401 = false;
      }
      
      return response;
    } catch (error) {
      // Pass through network errors
      throw error;
    }
  };
}

/**
 * Restore original fetch (useful for testing)
 */
export function removeApiInterceptor() {
  global.fetch = originalFetch;
}
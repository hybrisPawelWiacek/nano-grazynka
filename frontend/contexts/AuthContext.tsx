'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { 
  getOrCreateSessionId, 
  getUsageCount, 
  incrementUsageCount,
  clearAnonymousSession,
  getSessionIdForMigration 
} from '@/lib/anonymousSession';
import { migrateAnonymousSession, getAnonymousUsage } from '@/lib/api/anonymous';

interface User {
  id: string;
  email: string;
  tier: 'free' | 'pro' | 'business';
  creditsUsed: number;
  creditLimit: number;
  remainingCredits: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAnonymous: boolean;
  anonymousUsageCount: number;
  anonymousSessionId: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshAnonymousUsage: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [anonymousSessionId, setAnonymousSessionId] = useState<string | null>(null);
  const [anonymousUsageCount, setAnonymousUsageCount] = useState(0);

  useEffect(() => {
    // Initialize anonymous session FIRST before checking auth
    // This ensures session is available for all API calls
    if (typeof window !== 'undefined') {
      const sessionId = getOrCreateSessionId();
      // Always set the session ID from localStorage
      setAnonymousSessionId(sessionId);
      setAnonymousUsageCount(getUsageCount());
    }
    // Then check auth status
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe = false) => {
    // Keep the session ID before clearing
    const sessionToMigrate = anonymousSessionId;
    const hasAnonymousNotes = anonymousUsageCount > 0;
    
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, rememberMe }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    setUser(data.user);
    
    // Try to migrate anonymous session if there are notes
    if (sessionToMigrate && hasAnonymousNotes && data.user?.id) {
      try {
        const result = await migrateAnonymousSession(sessionToMigrate, data.user.id);
        if (result.migrated > 0) {
          toast.success(`Successfully transferred ${result.migrated} note${result.migrated > 1 ? 's' : ''} to your account`);
        }
      } catch (error) {
        console.error('Migration failed:', error);
        // Don't show error to user, just log it
      }
    }
    
    // Clear anonymous session after successful login
    clearAnonymousSession();
    setAnonymousSessionId(null);
    setAnonymousUsageCount(0);
  };

  const register = async (email: string, password: string) => {
    // Keep the session ID before clearing
    const sessionToMigrate = anonymousSessionId;
    const hasAnonymousNotes = anonymousUsageCount > 0;
    
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    setUser(data.user);
    
    // Try to migrate anonymous session if there are notes
    if (sessionToMigrate && hasAnonymousNotes && data.user?.id) {
      try {
        const result = await migrateAnonymousSession(sessionToMigrate, data.user.id);
        if (result.migrated > 0) {
          toast.success(`Successfully transferred ${result.migrated} note${result.migrated > 1 ? 's' : ''} to your account`);
        }
      } catch (error) {
        console.error('Migration failed:', error);
        // Don't show error to user, just log it
      }
    }
    
    // Clear anonymous session after successful registration
    clearAnonymousSession();
    setAnonymousSessionId(null);
    setAnonymousUsageCount(0);
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      // Clear any client-side token if exists
      Cookies.remove('token');
      
      // Clear all localStorage items and reset anonymous session
      clearAnonymousSession();
      localStorage.clear();
      
      // Create new anonymous session
      const newSessionId = getOrCreateSessionId();
      setAnonymousSessionId(newSessionId);
      setAnonymousUsageCount(0);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const refreshAnonymousUsage = async () => {
    if (typeof window !== 'undefined') {
      const sessionId = getOrCreateSessionId();
      if (sessionId) {
        try {
          const usage = await getAnonymousUsage(sessionId);
          setAnonymousUsageCount(usage.usageCount);
          // Also update localStorage for offline resilience
          localStorage.setItem('anonymousUsageCount', String(usage.usageCount));
        } catch (error) {
          console.error('Failed to fetch usage:', error);
          // Fallback to localStorage
          setAnonymousUsageCount(getUsageCount());
        }
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAnonymous: !user,
        anonymousSessionId,
        anonymousUsageCount,
        login,
        register,
        logout,
        refreshUser,
        refreshAnonymousUsage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
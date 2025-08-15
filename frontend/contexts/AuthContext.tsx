'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { 
  getOrCreateSessionId, 
  getUsageCount, 
  incrementUsageCount,
  clearAnonymousSession,
  getSessionIdForMigration 
} from '@/lib/anonymousSession';

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
  refreshAnonymousUsage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [anonymousSessionId, setAnonymousSessionId] = useState<string | null>(null);
  const [anonymousUsageCount, setAnonymousUsageCount] = useState(0);

  useEffect(() => {
    checkAuth();
    // Initialize anonymous session only if not already set
    if (typeof window !== 'undefined') {
      const sessionId = getOrCreateSessionId();
      // Only update state if sessionId is not already set
      // This prevents resetting the session on navigation
      setAnonymousSessionId(prevSessionId => prevSessionId || sessionId);
      setAnonymousUsageCount(getUsageCount());
    }
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
    
    // Clear anonymous session after successful login
    clearAnonymousSession();
    setAnonymousSessionId(null);
    setAnonymousUsageCount(0);
  };

  const register = async (email: string, password: string) => {
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
    
    // Clear anonymous session after successful login
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

  const refreshAnonymousUsage = () => {
    if (typeof window !== 'undefined') {
      setAnonymousUsageCount(getUsageCount());
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
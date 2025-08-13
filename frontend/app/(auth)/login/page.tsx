'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import styles from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password, rememberMe);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authCard}>
      <div className={styles.authHeader}>
        <h2 className={styles.authTitle}>
          Sign in to your account
        </h2>
        <p className={styles.authSubtitle}>
          Or{' '}
          <Link href="/register">
            create a new account
          </Link>
        </p>
      </div>
      <form className={styles.authForm} onSubmit={handleSubmit}>
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
        
        <div className={styles.formGroup}>
          <label htmlFor="email-address" className={styles.formLabel}>
            Email address
          </label>
          <input
            id="email-address"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={styles.formInput}
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.formLabel}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={styles.formInput}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.checkboxGroup}>
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className={styles.checkbox}
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember-me" className={styles.checkboxLabel}>
              Remember me
            </label>
          </div>

          <Link href="/reset-password" className={styles.forgotLink}>
            Forgot your password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={styles.submitButton}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
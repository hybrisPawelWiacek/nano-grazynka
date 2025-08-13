'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

interface UserSettings {
  email: string;
  tier: string;
  creditsUsed: number;
  creditLimit: number;
  createdAt: string;
  lastLoginAt: string;
  notificationPreferences: {
    emailOnComplete: boolean;
    emailOnFail: boolean;
    weeklyReport: boolean;
  };
  defaultLanguage: 'EN' | 'PL' | 'AUTO';
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Initialize settings from user data
    setSettings({
      email: user.email,
      tier: user.tier || 'free',
      creditsUsed: user.creditsUsed || 0,
      creditLimit: user.creditLimit || 5,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      notificationPreferences: {
        emailOnComplete: true,
        emailOnFail: true,
        weeklyReport: false
      },
      defaultLanguage: 'AUTO'
    });
    setLoading(false);
  }, [user, router]);

  const handleNotificationChange = (key: keyof UserSettings['notificationPreferences']) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      notificationPreferences: {
        ...settings.notificationPreferences,
        [key]: !settings.notificationPreferences[key]
      }
    });
  };

  const handleLanguageChange = (language: 'EN' | 'PL' | 'AUTO') => {
    if (!settings) return;
    setSettings({
      ...settings,
      defaultLanguage: language
    });
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      // In a real app, this would save to backend
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({
        type: 'success',
        text: 'Settings saved successfully!'
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to save settings. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({
        type: 'error',
        text: 'New passwords do not match'
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 8 characters long'
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:3101/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to change password');
      }

      setMessage({
        type: 'success',
        text: 'Password changed successfully!'
      });
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to change password. Please check your current password.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    // In a real app, this would delete the account
    // For now, we'll just log out
    await logout();
    router.push('/');
  };

  if (loading || !settings) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.headerTitle}>Account Settings</h1>
            <Link
              href="/dashboard"
              className={styles.backLink}
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {message && (
          <div className={`${styles.message} ${
            message.type === 'success' ? styles.messageSuccess : styles.messageError
          }`}>
            {message.text}
          </div>
        )}

        {/* Account Information */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Account Information</h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <p className={styles.value}>{settings.email}</p>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Account Tier</label>
              <div className={styles.valueWithLink}>
                <span className={styles.value}>{settings.tier}</span>
                {settings.tier === 'free' && (
                  <Link href="/pricing" className={styles.upgradeLink}>
                    Upgrade
                  </Link>
                )}
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Credits Used</label>
              <p className={styles.value}>
                {settings.creditsUsed} / {settings.creditLimit}
              </p>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Member Since</label>
              <p className={styles.value}>
                {new Date(settings.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Preferences</h2>
          
          {/* Default Language */}
          <div>
            <label className={styles.label}>
              Default Transcription Language
            </label>
            <div className={styles.languageSelector}>
              {(['AUTO', 'EN', 'PL'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`${styles.languageButton} ${
                    settings.defaultLanguage === lang
                      ? styles.languageButtonActive
                      : styles.languageButtonInactive
                  }`}
                >
                  {lang === 'AUTO' ? 'Auto-detect' : lang === 'EN' ? 'English' : 'Polish'}
                </button>
              ))}
            </div>
          </div>

          {/* Email Notifications */}
          <div>
            <h3 className={styles.label}>Email Notifications</h3>
            <div className={styles.checkboxGroup}>
              <div className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={settings.notificationPreferences.emailOnComplete}
                  onChange={() => handleNotificationChange('emailOnComplete')}
                  className={styles.checkbox}
                  id="emailOnComplete"
                />
                <label htmlFor="emailOnComplete" className={styles.checkboxLabel}>
                  Email me when transcription is complete
                </label>
              </div>
              <div className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={settings.notificationPreferences.emailOnFail}
                  onChange={() => handleNotificationChange('emailOnFail')}
                  className={styles.checkbox}
                  id="emailOnFail"
                />
                <label htmlFor="emailOnFail" className={styles.checkboxLabel}>
                  Email me if transcription fails
                </label>
              </div>
              <div className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={settings.notificationPreferences.weeklyReport}
                  onChange={() => handleNotificationChange('weeklyReport')}
                  className={styles.checkbox}
                  id="weeklyReport"
                />
                <label htmlFor="weeklyReport" className={styles.checkboxLabel}>
                  Send me weekly usage reports
                </label>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className={styles.buttonPrimary}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        {/* Change Password */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Change Password</h2>
          <form onSubmit={handleChangePassword} className={styles.passwordForm}>
            <div className={styles.field}>
              <label htmlFor="currentPassword" className={styles.label}>
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className={styles.input}
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="newPassword" className={styles.label}>
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className={styles.input}
                required
                minLength={8}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className={styles.input}
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className={styles.buttonPrimary}
            >
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className={`${styles.section} ${styles.sectionDanger}`}>
          <h2 className={`${styles.sectionTitle} ${styles.sectionTitleDanger}`}>Danger Zone</h2>
          <p className={styles.value}>
            Once you delete your account, there is no going back. Please be certain.
          </p>
          
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={styles.buttonDanger}
            >
              Delete Account
            </button>
          ) : (
            <div>
              <p className={styles.modalText} style={{ color: 'var(--color-error)', marginBottom: 'var(--space-3)' }}>
                Are you absolutely sure? This action cannot be undone.
              </p>
              <div className={styles.buttonGroup}>
                <button
                  onClick={handleDeleteAccount}
                  className={styles.buttonDanger}
                >
                  Yes, Delete My Account
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={styles.buttonSecondary}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
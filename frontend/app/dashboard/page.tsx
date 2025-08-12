'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

interface DashboardStats {
  creditsUsed: number;
  creditLimit: number;
  tier: string;
  totalVoiceNotes: number;
  recentVoiceNotes: VoiceNote[];
  monthlyReset: string;
}

interface VoiceNote {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  processingTime?: number;
  language?: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch user's voice notes
      const voiceNotesRes = await fetch('http://localhost:3101/api/voice-notes?limit=5', {
        credentials: 'include',
      });
      
      if (!voiceNotesRes.ok) {
        throw new Error('Failed to fetch voice notes');
      }
      
      const voiceNotesData = await voiceNotesRes.json();
      
      // Calculate stats
      const dashboardStats: DashboardStats = {
        creditsUsed: user.creditsUsed || 0,
        creditLimit: user.creditLimit || 5,
        tier: user.tier || 'free',
        totalVoiceNotes: voiceNotesData.pagination?.total || 0,
        recentVoiceNotes: voiceNotesData.data || [],
        monthlyReset: new Date(user.creditsResetDate || Date.now()).toLocaleDateString()
      };
      
      setStats(dashboardStats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = () => {
    if (!stats) return 0;
    return Math.round((stats.creditsUsed / stats.creditLimit) * 100);
  };

  const getTierClass = (tier: string) => {
    switch (tier) {
      case 'pro':
        return styles.tierPro;
      case 'business':
        return styles.tierBusiness;
      default:
        return styles.tierFree;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return styles.statusCompleted;
      case 'processing':
        return styles.statusProcessing;
      case 'failed':
        return styles.statusFailed;
      default:
        return styles.statusPending;
    }
  };

  if (authLoading || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <p className={styles.errorText}>Error loading dashboard: {error}</p>
          <button
            onClick={fetchDashboardStats}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user || !stats) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.headerTitle}>Dashboard</h1>
              <p className={styles.headerSubtitle}>
                Welcome back, {user.email}
              </p>
            </div>
            <div className={styles.headerActions}>
              <Link
                href="/settings"
                className={styles.settingsLink}
              >
                Settings
              </Link>
              <Link
                href="/"
                className={styles.uploadLink}
              >
                Upload Voice Note
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          {/* Usage Card */}
          <div className={styles.statCard}>
            <h3 className={styles.statLabel}>Monthly Usage</h3>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                <span className={styles.statNumber}>
                  {stats.creditsUsed}
                </span>
                <span className={styles.statUnit}>
                  / {stats.creditLimit} transcriptions
                </span>
              </div>
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${getUsagePercentage()}%` }}
                  ></div>
                </div>
                <p className={styles.resetDate}>
                  Resets on {stats.monthlyReset}
                </p>
              </div>
            </div>
          </div>

          {/* Tier Card */}
          <div className={styles.statCard}>
            <h3 className={styles.statLabel}>Current Tier</h3>
            <div className={styles.statContent}>
              <span className={`${styles.tierValue} ${getTierClass(stats.tier)}`}>
                {stats.tier}
              </span>
              {stats.tier === 'free' && (
                <div>
                  <Link
                    href="/pricing"
                    className={styles.upgradeLink}
                  >
                    Upgrade for more features →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Total Notes Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Voice Notes</h3>
            <div className="mt-2">
              <span className="text-2xl font-semibold text-gray-900">
                {stats.totalVoiceNotes}
              </span>
              <div className="mt-3">
                <Link
                  href="/voice-notes"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  View all notes →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Voice Notes */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Voice Notes</h2>
          </div>
          <div className="p-6">
            {stats.recentVoiceNotes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No voice notes yet</p>
                <Link
                  href="/"
                  className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Upload Your First Note
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Language
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats.recentVoiceNotes.map((note) => (
                      <tr key={note.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {note.title || 'Untitled'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(note.status)}`}>
                            {note.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {note.language || 'Auto'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/note/${note.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/pricing"
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">Upgrade Plan</h3>
            <p className="mt-2 text-sm text-gray-500">
              Get more transcriptions and advanced features
            </p>
          </Link>
          
          <Link
            href="/settings"
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">Account Settings</h3>
            <p className="mt-2 text-sm text-gray-500">
              Manage your profile and preferences
            </p>
          </Link>
          
          <Link
            href="/help"
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">Get Help</h3>
            <p className="mt-2 text-sm text-gray-500">
              View documentation and contact support
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
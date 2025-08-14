'use client';

import { useEffect, useState } from 'react';
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
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Get or create session ID
    const storedSessionId = localStorage.getItem('sessionId');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('sessionId', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      fetchDashboardStats();
    }
  }, [sessionId]);

  const fetchDashboardStats = async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      
      // Fetch user's voice notes
      const voiceNotesRes = await fetch('http://localhost:3101/api/voice-notes?limit=5', {
        headers: {
          'x-session-id': sessionId
        }
      });
      
      if (!voiceNotesRes.ok) {
        throw new Error('Failed to fetch voice notes');
      }
      
      const voiceNotesData = await voiceNotesRes.json();
      
      // Calculate stats
      const dashboardStats: DashboardStats = {
        creditsUsed: voiceNotesData.data?.length || 0,
        creditLimit: 5,
        tier: 'free',
        totalVoiceNotes: voiceNotesData.data?.length || 0,
        recentVoiceNotes: voiceNotesData.data || [],
        monthlyReset: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <p className={styles.errorText}>Unable to load dashboard</p>
          <button
            onClick={fetchDashboardStats}
            className={styles.retryButton}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logo}>
            nano-Grazynka
          </Link>
          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>
              Upload
            </Link>
            <Link href="/library" className={styles.navLink}>
              Library
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Welcome Section */}
          <div className={styles.welcomeSection}>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>Track your transcriptions and manage your account</p>
          </div>

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>This Month</p>
                <p className={styles.statValue}>{stats.creditsUsed}</p>
                <p className={styles.statDetail}>of {stats.creditLimit} transcriptions</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9 11l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Total Notes</p>
                <p className={styles.statValue}>{stats.totalVoiceNotes}</p>
                <p className={styles.statDetail}>All time</p>
              </div>
            </div>
          </div>

          {/* Usage Progress */}
          <div className={styles.usageCard}>
            <div className={styles.usageHeader}>
              <h3 className={styles.usageTitle}>Monthly Usage</h3>
              <span className={styles.usagePercentage}>{getUsagePercentage()}%</span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${getUsagePercentage()}%` }}
              />
            </div>
            <p className={styles.resetText}>Resets {stats.monthlyReset}</p>
          </div>

          {/* Recent Notes */}
          <div className={styles.recentSection}>
            <h2 className={styles.sectionTitle}>Recent Notes</h2>
            
            {stats.recentVoiceNotes.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
                          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className={styles.emptyText}>No notes yet</p>
                <p className={styles.emptySubtext}>Upload your first voice note to get started</p>
                <Link href="/" className={styles.uploadButton}>
                  Upload Voice Note
                </Link>
              </div>
            ) : (
              <div className={styles.notesList}>
                {stats.recentVoiceNotes.map((note) => (
                  <Link 
                    key={note.id} 
                    href={`/note/${note.id}`}
                    className={styles.noteCard}
                  >
                    <div className={styles.noteHeader}>
                      <h3 className={styles.noteTitle}>
                        {note.title || 'Untitled Note'}
                      </h3>
                      <span className={styles.noteDate}>
                        {formatDate(note.createdAt)}
                      </span>
                    </div>
                    <div className={styles.noteMeta}>
                      <span className={`${styles.noteStatus} ${styles[`status${note.status.charAt(0).toUpperCase() + note.status.slice(1)}`]}`}>
                        {note.status}
                      </span>
                      {note.language && (
                        <span className={styles.noteLanguage}>
                          {note.language}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
                
                {stats.totalVoiceNotes > 5 && (
                  <Link href="/library" className={styles.viewAllLink}>
                    View all {stats.totalVoiceNotes} notes →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import UploadZone from '@/components/UploadZone';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = (id: string) => {
    // Navigate to the voice note detail page after successful upload
    router.push(`/notes/${id}`);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>nano-Grazynka</h1>
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

      <main className={styles.main}>
        <div className={styles.hero}>
          <h2 className={styles.title}>Voice Note Transcription & Summarization</h2>
          <p className={styles.subtitle}>
            Upload your audio files to get instant transcriptions, summaries, and action items
          </p>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <svg
              className={styles.errorIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <UploadZone 
          onUploadComplete={handleUploadComplete}
          onError={handleError}
        />

        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Multi-Language</h3>
            <p className={styles.featureDescription}>
              Supports English and Polish transcription with language-specific prompts
            </p>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="9" x2="15" y2="9" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="9" y1="15" x2="11" y2="15" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Smart Summaries</h3>
            <p className={styles.featureDescription}>
              AI-powered summarization with key points and action items extraction
            </p>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Export Ready</h3>
            <p className={styles.featureDescription}>
              Download your transcriptions and summaries in Markdown or JSON format
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
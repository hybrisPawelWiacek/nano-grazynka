'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to dashboard after 5 seconds
    const timeout = setTimeout(() => {
      router.push('/dashboard');
    }, 5000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Success Icon */}
        <div className={styles.iconWrapper}>
          <svg
            className={styles.icon}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7"></path>
          </svg>
        </div>

        <h1 className={styles.title}>
          Payment Successful!
        </h1>
        
        <p className={styles.description}>
          Your subscription has been upgraded successfully. You now have access to all premium features.
        </p>

        <div className={styles.infoBox}>
          <h3 className={styles.infoTitle}>What's next?</h3>
          <ul className={styles.infoList}>
            <li className={styles.infoItem}>Your new plan is active immediately</li>
            <li className={styles.infoItem}>Credits have been added to your account</li>
            <li className={styles.infoItem}>Check your dashboard for updated limits</li>
            <li className={styles.infoItem}>You'll receive a confirmation email shortly</li>
          </ul>
        </div>

        <div className={styles.buttonGroup}>
          <Link
            href="/dashboard"
            className={styles.buttonPrimary}
          >
            Go to Dashboard
          </Link>
          
          <Link
            href="/"
            className={styles.buttonSecondary}
          >
            Upload Voice Note
          </Link>
        </div>

        <p className={styles.redirectText}>
          Redirecting to dashboard in 5 seconds...
        </p>
      </div>
    </div>
  );
}
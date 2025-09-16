'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  creditsPerMonth: number;
  rateLimit: number;
  recommended?: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    creditsPerMonth: 5,
    rateLimit: 10,
    features: [
      '5 transcriptions per month',
      'Basic AI summaries',
      '10 requests per minute',
      'Email support',
      'Standard processing'
    ]
  },
  {
    id: 'pro_monthly',
    name: 'Pro',
    price: 9.99,
    interval: 'month',
    creditsPerMonth: 50,
    rateLimit: 60,
    recommended: true,
    features: [
      '50 transcriptions per month',
      'Advanced AI summaries',
      'Priority processing',
      '60 requests per minute',
      'Email & chat support',
      'Export to multiple formats',
      'Custom prompts'
    ]
  },
  {
    id: 'business_monthly',
    name: 'Business',
    price: 29.99,
    interval: 'month',
    creditsPerMonth: 200,
    rateLimit: 120,
    features: [
      '200 transcriptions per month',
      'Premium AI features',
      'Instant processing',
      '120 requests per minute',
      'Priority support',
      'API access',
      'Team collaboration',
      'Advanced analytics'
    ]
  }
];

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (planId === 'free') {
      // Downgrade to free
      if (user.tier === 'free') {
        return; // Already on free plan
      }
      
      setLoading(planId);
      try {
        const response = await fetch(`${API_URL}/api/payments/cancel-subscription`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to cancel subscription');
        }

        // Refresh user data
        window.location.href = '/dashboard';
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(null);
      }
    } else {
      // Upgrade to paid plan
      setLoading(planId);
      try {
        const priceId = `price_mock_${planId}`;
        const response = await fetch(`${API_URL}/api/payments/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ priceId }),
        });

        if (!response.ok) {
          throw new Error('Failed to create checkout session');
        }

        const data = await response.json();
        
        // In production, this would redirect to Stripe checkout
        // For mock, we'll simulate the payment flow
        if (data.checkoutUrl) {
          // Simulate successful payment
          const webhookResponse = await fetch(`${API_URL}/api/payments/webhook`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId: data.sessionId,
              customerId: 'mock_customer',
              priceId: priceId
            }),
          });

          if (!webhookResponse.ok) {
            throw new Error('Payment processing failed');
          }

          // Update tier directly (for testing)
          const tier = planId.includes('pro') ? 'pro' : 'business';
          const upgradeResponse = await fetch(`${API_URL}/api/payments/upgrade-tier`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ tier }),
          });

          if (!upgradeResponse.ok) {
            throw new Error('Failed to upgrade tier');
          }

          // Redirect to success page
          router.push('/payment/success');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(null);
      }
    }
  };

  const getCurrentPlan = () => {
    if (!user) return null;
    if (user.tier === 'pro') return 'pro_monthly';
    if (user.tier === 'business') return 'business_monthly';
    return 'free';
  };

  const currentPlan = getCurrentPlan();

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Choose Your Plan</h1>
          <p className={styles.subtitle}>
            Select the perfect plan for your voice transcription needs
          </p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {/* Pricing Cards */}
        <div className={styles.pricingGrid}>
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`${styles.card} ${
                plan.recommended ? styles.cardRecommended : ''
              }`}
            >
              {plan.recommended && (
                <div className={styles.recommendedBadge}>
                  Recommended
                </div>
              )}

              <div className={styles.cardHeader}>
                <h3 className={styles.planName}>{plan.name}</h3>
                <div className={styles.priceWrapper}>
                  <span className={styles.price}>
                    ${plan.price}
                  </span>
                  <span className={styles.interval}>/{plan.interval}</span>
                </div>
                <p className={styles.credits}>
                  {plan.creditsPerMonth} transcriptions per month
                </p>
              </div>

              <ul className={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <li key={index} className={styles.featureItem}>
                    <svg
                      className={styles.featureIcon}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className={styles.featureText}>{feature}</span>
                  </li>
                ))}
              </ul>

              <div>
                {currentPlan === plan.id ? (
                  <button
                    disabled
                    className={`${styles.selectButton} ${styles.selectButtonDisabled}`}
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading !== null}
                    className={`${styles.selectButton} ${
                      loading === plan.id
                        ? styles.selectButtonLoading
                        : plan.recommended
                        ? styles.selectButtonPrimary
                        : styles.selectButtonSecondary
                    }`}
                  >
                    {loading === plan.id ? 'Processing...' : 
                     plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className={styles.faqSection}>
          <h2 className={styles.faqTitle}>
            Frequently Asked Questions
          </h2>
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                Can I change plans at any time?
              </h3>
              <p className={styles.faqAnswer}>
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                What happens if I exceed my monthly limit?
              </h3>
              <p className={styles.faqAnswer}>
                You won't be able to upload new voice notes until the next month or until you upgrade your plan.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                Do unused credits roll over?
              </h3>
              <p className={styles.faqAnswer}>
                No, unused credits do not roll over to the next month. Your credit balance resets monthly.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                Is there a free trial for paid plans?
              </h3>
              <p className={styles.faqAnswer}>
                We offer a generous free tier with 5 transcriptions per month. You can upgrade anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className={styles.backLinkWrapper}>
          <Link
            href="/dashboard"
            className={styles.backLink}
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
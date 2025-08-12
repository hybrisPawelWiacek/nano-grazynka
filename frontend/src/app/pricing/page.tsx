'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
        const response = await fetch('http://localhost:3101/api/payments/cancel-subscription', {
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
        const response = await fetch('http://localhost:3101/api/payments/create-checkout-session', {
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
          const webhookResponse = await fetch('http://localhost:3101/api/payments/webhook', {
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
          const upgradeResponse = await fetch('http://localhost:3101/api/payments/upgrade-tier', {
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Choose Your Plan</h1>
          <p className="mt-4 text-xl text-gray-600">
            Select the perfect plan for your voice transcription needs
          </p>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-lg shadow-lg p-8 ${
                plan.recommended ? 'ring-2 ring-indigo-600' : ''
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Recommended
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-500">/{plan.interval}</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {plan.creditsPerMonth} transcriptions per month
                </p>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {currentPlan === plan.id ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 bg-gray-300 text-gray-500 rounded-md font-semibold cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading !== null}
                    className={`w-full py-3 px-4 rounded-md font-semibold transition-colors ${
                      loading === plan.id
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : plan.recommended
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-800 text-white hover:bg-gray-900'
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
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Can I change plans at any time?
              </h3>
              <p className="mt-2 text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                What happens if I exceed my monthly limit?
              </h3>
              <p className="mt-2 text-gray-600">
                You won't be able to upload new voice notes until the next month or until you upgrade your plan.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Do unused credits roll over?
              </h3>
              <p className="mt-2 text-gray-600">
                No, unused credits do not roll over to the next month. Your credit balance resets monthly.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Is there a free trial for paid plans?
              </h3>
              <p className="mt-2 text-gray-600">
                We offer a generous free tier with 5 transcriptions per month. You can upgrade anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-12 text-center">
          <Link
            href="/dashboard"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
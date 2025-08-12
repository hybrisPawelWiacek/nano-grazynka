// Mock Stripe Adapter for MVP
// This simulates Stripe payment processing without actual API calls

export interface StripeCustomer {
  id: string;
  email: string;
  created: Date;
}

export interface StripeSubscription {
  id: string;
  customerId: string;
  status: 'active' | 'canceled' | 'past_due';
  priceId: string;
  currentPeriodEnd: Date;
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'processing' | 'failed';
  clientSecret: string;
}

export interface StripePrice {
  id: string;
  productId: string;
  unitAmount: number;
  currency: string;
  recurring?: {
    interval: 'month' | 'year';
  };
}

export class MockStripeAdapter {
  // Mock price IDs for different tiers
  private readonly PRICES = {
    pro_monthly: {
      id: 'price_mock_pro_monthly',
      productId: 'prod_mock_pro',
      unitAmount: 999, // $9.99
      currency: 'usd',
      recurring: { interval: 'month' as const }
    },
    pro_yearly: {
      id: 'price_mock_pro_yearly',
      productId: 'prod_mock_pro',
      unitAmount: 9999, // $99.99
      currency: 'usd',
      recurring: { interval: 'year' as const }
    },
    business_monthly: {
      id: 'price_mock_business_monthly',
      productId: 'prod_mock_business',
      unitAmount: 2999, // $29.99
      currency: 'usd',
      recurring: { interval: 'month' as const }
    }
  };

  // In-memory storage for mock data
  private customers: Map<string, StripeCustomer> = new Map();
  private subscriptions: Map<string, StripeSubscription> = new Map();
  private customerIdByEmail: Map<string, string> = new Map();

  async createCustomer(email: string): Promise<StripeCustomer> {
    // Check if customer already exists
    const existingId = this.customerIdByEmail.get(email);
    if (existingId) {
      const existing = this.customers.get(existingId);
      if (existing) return existing;
    }

    const customer: StripeCustomer = {
      id: `cus_mock_${Date.now()}`,
      email,
      created: new Date()
    };

    this.customers.set(customer.id, customer);
    this.customerIdByEmail.set(email, customer.id);
    
    console.log(`[MockStripe] Created customer: ${customer.id} for ${email}`);
    return customer;
  }

  async createSubscription(
    customerId: string,
    priceId: string
  ): Promise<StripeSubscription> {
    // Cancel any existing subscription for this customer
    for (const [id, sub] of this.subscriptions.entries()) {
      if (sub.customerId === customerId && sub.status === 'active') {
        sub.status = 'canceled';
        console.log(`[MockStripe] Canceled existing subscription: ${id}`);
      }
    }

    const subscription: StripeSubscription = {
      id: `sub_mock_${Date.now()}`,
      customerId,
      status: 'active',
      priceId,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };

    this.subscriptions.set(subscription.id, subscription);
    
    console.log(`[MockStripe] Created subscription: ${subscription.id} for customer ${customerId}`);
    return subscription;
  }

  async cancelSubscription(subscriptionId: string): Promise<StripeSubscription> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    subscription.status = 'canceled';
    console.log(`[MockStripe] Canceled subscription: ${subscriptionId}`);
    return subscription;
  }

  async createPaymentIntent(
    amount: number,
    currency: string = 'usd'
  ): Promise<StripePaymentIntent> {
    const paymentIntent: StripePaymentIntent = {
      id: `pi_mock_${Date.now()}`,
      amount,
      currency,
      status: 'succeeded', // Always succeed in mock mode
      clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`
    };

    console.log(`[MockStripe] Created payment intent: ${paymentIntent.id} for ${amount} ${currency}`);
    return paymentIntent;
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ id: string; url: string }> {
    const sessionId = `cs_mock_${Date.now()}`;
    
    // In real Stripe, this would create a hosted checkout page
    // For mock, we just return a fake URL
    const checkoutUrl = `${successUrl}?session_id=${sessionId}&mock=true`;
    
    console.log(`[MockStripe] Created checkout session: ${sessionId}`);
    
    // Simulate creating a subscription after "payment"
    setTimeout(() => {
      this.createSubscription(customerId, priceId);
    }, 1000);
    
    return {
      id: sessionId,
      url: checkoutUrl
    };
  }

  async getSubscription(subscriptionId: string): Promise<StripeSubscription | null> {
    return this.subscriptions.get(subscriptionId) || null;
  }

  async getCustomerByEmail(email: string): Promise<StripeCustomer | null> {
    const customerId = this.customerIdByEmail.get(email);
    if (!customerId) return null;
    return this.customers.get(customerId) || null;
  }

  async getActiveSubscriptionForCustomer(customerId: string): Promise<StripeSubscription | null> {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.customerId === customerId && subscription.status === 'active') {
        return subscription;
      }
    }
    return null;
  }

  // Helper to get tier from price ID
  getTierFromPriceId(priceId: string): 'pro' | 'business' | null {
    if (priceId.includes('pro')) return 'pro';
    if (priceId.includes('business')) return 'business';
    return null;
  }

  // Get available prices
  getPrices(): typeof this.PRICES {
    return this.PRICES;
  }

  // Webhook simulation (for testing)
  async simulateWebhook(event: string, data: any): Promise<void> {
    console.log(`[MockStripe] Webhook event: ${event}`, data);
    
    switch (event) {
      case 'customer.subscription.created':
        console.log(`[MockStripe] Subscription created: ${data.id}`);
        break;
      case 'customer.subscription.deleted':
        console.log(`[MockStripe] Subscription canceled: ${data.id}`);
        break;
      case 'invoice.payment_succeeded':
        console.log(`[MockStripe] Payment succeeded for invoice: ${data.id}`);
        break;
      default:
        console.log(`[MockStripe] Unhandled webhook event: ${event}`);
    }
  }
}
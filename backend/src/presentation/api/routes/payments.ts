import { FastifyPluginAsync } from 'fastify';
import { MockStripeAdapter } from '../../../infrastructure/external/MockStripeAdapter';
import { UserRepositoryImpl } from '../../../infrastructure/persistence/UserRepositoryImpl';
import { PrismaClient } from '@prisma/client';
import { createAuthenticateMiddleware } from '../middleware/authenticate';
import { JwtService } from '../../../infrastructure/auth/JwtService';

const paymentsRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma = new PrismaClient();
  const userRepository = new UserRepositoryImpl(prisma);
  const stripeAdapter = new MockStripeAdapter();
  const jwtService = new JwtService();
  
  const authenticate = createAuthenticateMiddleware(jwtService, userRepository);

  // Get available pricing plans
  fastify.get('/api/payments/prices', async (request, reply) => {
    const prices = stripeAdapter.getPrices();
    return {
      prices: Object.values(prices).map(price => ({
        id: price.id,
        productId: price.productId,
        unitAmount: price.unitAmount,
        currency: price.currency,
        recurring: price.recurring,
        displayAmount: `$${(price.unitAmount / 100).toFixed(2)}`
      }))
    };
  });

  // Create checkout session
  fastify.post('/api/payments/create-checkout-session', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['priceId'],
        properties: {
          priceId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { priceId } = request.body as { priceId: string };
    const user = request.user!;

    try {
      // Get or create Stripe customer
      let customer = await stripeAdapter.getCustomerByEmail(user.email);
      if (!customer) {
        customer = await stripeAdapter.createCustomer(user.email);
      }

      // Create checkout session
      const session = await stripeAdapter.createCheckoutSession(
        customer.id,
        priceId,
        `${process.env.FRONTEND_URL || 'http://localhost:3100'}/payment/success`,
        `${process.env.FRONTEND_URL || 'http://localhost:3100'}/payment/cancel`
      );

      return {
        sessionId: session.id,
        checkoutUrl: session.url
      };
    } catch (error: any) {
      reply.code(500).send({ 
        error: 'Failed to create checkout session',
        message: error.message 
      });
    }
  });

  // Handle payment success (webhook simulation)
  fastify.post('/api/payments/webhook', {
    schema: {
      body: {
        type: 'object',
        required: ['sessionId', 'customerId', 'priceId'],
        properties: {
          sessionId: { type: 'string' },
          customerId: { type: 'string' },
          priceId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { sessionId, customerId, priceId } = request.body as {
      sessionId: string;
      customerId: string;
      priceId: string;
    };

    try {
      // Create subscription
      const subscription = await stripeAdapter.createSubscription(customerId, priceId);
      
      // Update user tier based on price
      const tier = stripeAdapter.getTierFromPriceId(priceId);
      if (tier) {
        // Find user by email from customer
        const customers = await stripeAdapter.getCustomerByEmail(''); // This is a limitation of our mock
        
        // In a real implementation, we'd update the user's tier in the database
        console.log(`[Webhook] Would update user to tier: ${tier}`);
        
        // Simulate webhook event
        await stripeAdapter.simulateWebhook('customer.subscription.created', {
          id: subscription.id,
          customer: customerId,
          price: priceId
        });
      }

      return { success: true, subscriptionId: subscription.id };
    } catch (error: any) {
      reply.code(500).send({ 
        error: 'Webhook processing failed',
        message: error.message 
      });
    }
  });

  // Get user's subscription status
  fastify.get('/api/payments/subscription', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    const user = request.user!;

    try {
      // Get Stripe customer
      const customer = await stripeAdapter.getCustomerByEmail(user.email);
      if (!customer) {
        return {
          hasSubscription: false,
          tier: 'free'
        };
      }

      // Get active subscription
      const subscription = await stripeAdapter.getActiveSubscriptionForCustomer(customer.id);
      
      if (!subscription) {
        return {
          hasSubscription: false,
          tier: 'free'
        };
      }

      const tier = stripeAdapter.getTierFromPriceId(subscription.priceId) || 'free';

      return {
        hasSubscription: true,
        tier,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd
        }
      };
    } catch (error: any) {
      reply.code(500).send({ 
        error: 'Failed to get subscription status',
        message: error.message 
      });
    }
  });

  // Cancel subscription
  fastify.post('/api/payments/cancel-subscription', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    const user = request.user!;

    try {
      // Get customer
      const customer = await stripeAdapter.getCustomerByEmail(user.email);
      if (!customer) {
        return reply.code(404).send({ 
          error: 'No subscription found' 
        });
      }

      // Get active subscription
      const subscription = await stripeAdapter.getActiveSubscriptionForCustomer(customer.id);
      if (!subscription) {
        return reply.code(404).send({ 
          error: 'No active subscription found' 
        });
      }

      // Cancel subscription
      const canceled = await stripeAdapter.cancelSubscription(subscription.id);
      
      // Update user tier to free
      await userRepository.updateTier(user.id!, 'free');
      
      // Simulate webhook
      await stripeAdapter.simulateWebhook('customer.subscription.deleted', {
        id: canceled.id,
        customer: customer.id
      });

      return {
        success: true,
        message: 'Subscription canceled successfully'
      };
    } catch (error: any) {
      reply.code(500).send({ 
        error: 'Failed to cancel subscription',
        message: error.message 
      });
    }
  });

  // Upgrade tier (direct tier change for testing)
  fastify.post('/api/payments/upgrade-tier', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['tier'],
        properties: {
          tier: { 
            type: 'string',
            enum: ['free', 'pro', 'business']
          }
        }
      }
    }
  }, async (request, reply) => {
    const { tier } = request.body as { tier: string };
    const user = request.user!;

    try {
      // Update user tier directly (for testing)
      await userRepository.updateTier(user.id!, tier);
      
      return {
        success: true,
        message: `Tier updated to ${tier}`,
        tier
      };
    } catch (error: any) {
      reply.code(500).send({ 
        error: 'Failed to upgrade tier',
        message: error.message 
      });
    }
  });
};

export default paymentsRoutes;
import { FastifyRequest, FastifyReply } from 'fastify';
import { UserEntity } from '../../../domain/entities/User';

// Store rate limit data in memory (for MVP - in production use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limits by tier (requests per minute)
const RATE_LIMITS = {
  free: 10,      // 10 requests per minute
  pro: 60,       // 60 requests per minute
  business: 120  // 120 requests per minute
};

export function createRateLimitMiddleware() {
  return async function rateLimit(
    request: FastifyRequest & { user?: UserEntity },
    reply: FastifyReply
  ) {
    try {
      const user = request.user;
      
      if (!user) {
        // For anonymous users, use their session ID as the rate limit identifier
        // This gives each anonymous session its own rate limit bucket
        const sessionId = request.headers['x-session-id'] as string;
        const identifier = sessionId || 'anonymous-no-session';
        return applyRateLimit(request, reply, identifier, 20);
      }

      const tier = user.tier as keyof typeof RATE_LIMITS;
      const limit = RATE_LIMITS[tier] || RATE_LIMITS.free;
      
      return applyRateLimit(request, reply, user.id!, limit);
    } catch (error) {
      // Don't block requests on rate limit errors
      console.error('Rate limit error:', error);
    }
  };
}

function applyRateLimit(
  request: FastifyRequest,
  reply: FastifyReply,
  identifier: string,
  limit: number
): void | Promise<void> {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  
  // Get or create rate limit data
  let data = rateLimitStore.get(identifier);
  
  if (!data || now > data.resetTime) {
    // Create new window
    data = {
      count: 1,
      resetTime: now + windowMs
    };
    rateLimitStore.set(identifier, data);
  } else {
    // Increment counter
    data.count++;
  }
  
  // Set rate limit headers
  reply.header('X-RateLimit-Limit', limit.toString());
  reply.header('X-RateLimit-Remaining', Math.max(0, limit - data.count).toString());
  reply.header('X-RateLimit-Reset', new Date(data.resetTime).toISOString());
  
  // Check if limit exceeded
  if (data.count > limit) {
    const retryAfter = Math.ceil((data.resetTime - now) / 1000);
    reply.header('Retry-After', retryAfter.toString());
    
    return reply.code(429).send({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      retryAfter,
      limit,
      resetTime: new Date(data.resetTime).toISOString()
    });
  }
}

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime + 60000) { // Remove entries older than 1 minute past reset
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);
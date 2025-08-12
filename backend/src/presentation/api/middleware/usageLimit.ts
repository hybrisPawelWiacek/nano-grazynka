import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { UserEntity } from '../../../domain/entities/User';
import { UserRepository } from '../../../infrastructure/persistence/UserRepositoryImpl';

export function createUsageLimitMiddleware(userRepository: UserRepository) {
  return async function checkUsageLimit(
    request: FastifyRequest & { user?: UserEntity },
    reply: FastifyReply
  ) {
    try {
      const user = request.user;
      
      if (!user) {
        return reply.code(401).send({ error: 'Authentication required' });
      }

      // Check if user needs credit reset
      let currentUser = user;
      if (user.shouldResetCredits()) {
        currentUser = await userRepository.resetCredits(user.id!);
        request.user = currentUser;
      }

      // Check if user has credits available
      if (!currentUser.hasCreditsAvailable) {
        return reply.code(403).send({ 
          error: 'Monthly limit reached',
          message: `You have used all ${currentUser.creditLimit} voice notes for this month. Upgrade to Pro for unlimited transcriptions.`,
          creditsUsed: currentUser.creditsUsed,
          creditLimit: currentUser.creditLimit,
          tier: currentUser.tier,
          upgradeUrl: '/upgrade'
        });
      }
    } catch (error) {
      return reply.code(500).send({ error: 'Error checking usage limits' });
    }
  };
}
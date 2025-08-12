import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtService } from '../../../infrastructure/auth/JwtService';
import { UserRepository } from '../../../domain/repositories/UserRepository';
import { extractToken } from './authenticate';

/**
 * Optional authentication middleware - allows both authenticated and anonymous users
 * For authenticated users, attaches user to request
 * For anonymous users, allows request to proceed without user
 */
export function createOptionalAuthMiddleware(
  jwtService: JwtService,
  userRepository: UserRepository
) {
  return async function optionalAuth(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      // Get token from cookie or Authorization header
      const token = extractToken(request);
      
      if (token) {
        // If token exists, try to authenticate
        try {
          const payload = jwtService.verify(token);
          const user = await userRepository.findById(payload.userId);
          
          if (user) {
            // Attach user to request if found
            request.user = user;
          }
        } catch (error) {
          // Invalid token - continue as anonymous
          console.log('Invalid token, proceeding as anonymous:', error);
        }
      }
      
      // Continue whether authenticated or not
    } catch (error) {
      console.error('Error in optional auth middleware:', error);
      // Continue even if there's an error
    }
  };
}
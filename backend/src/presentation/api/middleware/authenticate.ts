import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { JwtService } from '../../../infrastructure/auth/JwtService';
import { UserRepositoryImpl } from '../../../infrastructure/persistence/UserRepositoryImpl';
import { UserEntity } from '../../../domain/entities/User';

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserEntity;
  }
}

export function createAuthenticateMiddleware(
  jwtService: JwtService,
  userRepository: UserRepositoryImpl
) {
  return async function authenticate(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      // Get token from cookie or Authorization header
      const token = extractToken(request);
      
      if (!token) {
        return reply.code(401).send({ error: 'Authentication required' });
      }

      // Verify JWT
      const payload = jwtService.verify(token);
      
      // Get user from database
      const user = await userRepository.findById(payload.userId);
      
      if (!user) {
        return reply.code(401).send({ error: 'User not found' });
      }

      // Attach user to request
      request.user = user;
    } catch (error) {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }
  };
}

export function extractToken(request: FastifyRequest): string | null {
  // Try cookie first
  const cookieToken = request.cookies?.token;
  if (cookieToken) {
    return cookieToken;
  }

  // Try Authorization header
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}
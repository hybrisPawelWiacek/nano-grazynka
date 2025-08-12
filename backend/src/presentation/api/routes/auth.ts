import { FastifyPluginAsync } from 'fastify';
import { RegisterUserUseCase } from '../../../application/use-cases/RegisterUserUseCase';
import { LoginUserUseCase } from '../../../application/use-cases/LoginUserUseCase';
import { AuthService } from '../../../domain/services/AuthService';
import { UserRepositoryImpl } from '../../../infrastructure/persistence/UserRepositoryImpl';
import { PasswordService } from '../../../infrastructure/auth/PasswordService';
import { JwtService } from '../../../infrastructure/auth/JwtService';
import { PrismaClient } from '@prisma/client';
import { createAuthenticateMiddleware } from '../middleware/authenticate';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma = new PrismaClient();
  const userRepository = new UserRepositoryImpl(prisma);
  const passwordService = new PasswordService();
  const jwtService = new JwtService();
  const authService = new AuthService(userRepository, passwordService, jwtService);
  
  const registerUseCase = new RegisterUserUseCase(authService);
  const loginUseCase = new LoginUserUseCase(authService);
  
  const authenticate = createAuthenticateMiddleware(jwtService, userRepository);

  // Register endpoint
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                tier: { type: 'string' },
                creditsUsed: { type: 'number' },
                creditLimit: { type: 'number' }
              }
            },
            token: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { email, password } = request.body as { email: string; password: string };
      const result = await registerUseCase.execute({ email, password });
      
      // Set JWT in httpOnly cookie
      reply.setCookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/'
      });
      
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        reply.code(409).send({ error: error.message });
      } else if (error instanceof Error) {
        reply.code(400).send({ error: error.message });
      } else {
        reply.code(500).send({ error: 'Internal server error' });
      }
    }
  });

  // Login endpoint
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' },
          rememberMe: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                tier: { type: 'string' },
                creditsUsed: { type: 'number' },
                creditLimit: { type: 'number' }
              }
            },
            token: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { email, password, rememberMe } = request.body as { 
        email: string; 
        password: string; 
        rememberMe?: boolean;
      };
      const result = await loginUseCase.execute({ email, password, rememberMe });
      
      // Set JWT in httpOnly cookie
      const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      reply.setCookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge,
        path: '/'
      });
      
      return result;
    } catch (error) {
      reply.code(401).send({ error: 'Invalid email or password' });
    }
  });

  // Logout endpoint
  fastify.post('/logout', async (request, reply) => {
    reply.clearCookie('token', { path: '/' });
    return { success: true };
  });

  // Get current user
  fastify.get('/me', {
    preHandler: [authenticate],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            tier: { type: 'string' },
            creditsUsed: { type: 'number' },
            creditLimit: { type: 'number' },
            remainingCredits: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const user = request.user!;
    return {
      id: user.id,
      email: user.email,
      tier: user.tier,
      creditsUsed: user.creditsUsed,
      creditLimit: user.creditLimit,
      remainingCredits: user.remainingCredits
    };
  });

  // Password reset request (simplified for MVP)
  fastify.post('/reset-password-request', {
    schema: {
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
        }
      }
    }
  }, async (request, reply) => {
    const { email } = request.body as { email: string };
    
    // For MVP, just log to console
    console.log(`Password reset requested for: ${email}`);
    console.log(`Reset link: http://localhost:3100/reset-password?token=mock-token`);
    
    return { 
      success: true, 
      message: 'If an account exists with this email, a reset link has been sent.' 
    };
  });
};

export default authRoutes;
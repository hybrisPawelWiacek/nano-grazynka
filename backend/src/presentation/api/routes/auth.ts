import { FastifyPluginAsync } from 'fastify';
import { RegisterUserUseCase } from '../../../application/use-cases/RegisterUserUseCase';
import { LoginUserUseCase } from '../../../application/use-cases/LoginUserUseCase';
import { AuthService } from '../../../domain/services/AuthService';
import { UserRepositoryImpl } from '../../../infrastructure/persistence/UserRepositoryImpl';
import { PasswordService } from '../../../infrastructure/auth/PasswordService';
import { JwtService } from '../../../infrastructure/auth/JwtService';
import { LoginAttemptService } from '../../../infrastructure/auth/LoginAttemptService';
import { PrismaClient } from '@prisma/client';
import { createAuthenticateMiddleware } from '../middleware/authenticate';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma = new PrismaClient();
  const userRepository = new UserRepositoryImpl(prisma);
  const passwordService = new PasswordService();
  const jwtService = new JwtService();
  const loginAttemptService = new LoginAttemptService(prisma);
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
            }
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
      
      // Return only user data, token is in httpOnly cookie
      return { user: result.user };
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        return reply.code(409).send({ error: error.message });
      } else if (error instanceof Error) {
        return reply.code(400).send({ error: error.message });
      } else {
        return reply.code(500).send({ error: 'Internal server error' });
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
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const clientIP = LoginAttemptService.getClientIp(request);
    const { email, password, rememberMe } = request.body as { 
      email: string; 
      password: string; 
      rememberMe?: boolean;
    };

    try {
      // Check if account is locked due to failed attempts
      const lockStatus = await loginAttemptService.getAccountLockStatus(email, clientIP);
      
      if (lockStatus.isLocked) {
        await loginAttemptService.recordLoginAttempt(email, clientIP, false);
        return reply.code(429).send({ 
          error: 'Account temporarily locked due to too many failed login attempts',
          message: `Please try again after ${lockStatus.lockedUntil?.toLocaleTimeString()}`,
          retryAfter: lockStatus.lockedUntil ? Math.ceil((lockStatus.lockedUntil.getTime() - Date.now()) / 1000) : 900
        });
      }
      
      const result = await loginUseCase.execute({ email, password, rememberMe });
      
      // Record successful login attempt
      await loginAttemptService.recordLoginAttempt(email, clientIP, true);
      
      // Clear any failed attempts for this email
      await loginAttemptService.clearFailedAttempts(email);
      
      // Set JWT in httpOnly cookie
      const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      reply.setCookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge,
        path: '/'
      });
      
      // Return only user data, token is in httpOnly cookie
      return { user: result.user };
    } catch (error) {
      // Record failed login attempt
      await loginAttemptService.recordLoginAttempt(email, clientIP, false);
      
      if (error instanceof Error && error.message.includes('Invalid credentials')) {
        const lockStatus = await loginAttemptService.getAccountLockStatus(email, clientIP);
        const remainingAttempts = lockStatus.remainingAttempts;
        
        if (remainingAttempts <= 1) {
          return reply.code(401).send({ 
            error: 'Invalid email or password. Your account will be temporarily locked after one more failed attempt.',
            remainingAttempts
          });
        } else {
          return reply.code(401).send({ 
            error: 'Invalid email or password',
            remainingAttempts
          });
        }
      } else {
        return reply.code(401).send({ error: 'Invalid email or password' });
      }
    }
  });

  // Logout endpoint
  fastify.post('/logout', async (_request, reply) => {
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
  }, async (request, _reply) => {
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
  }, async (_request, _reply) => {
    const { email } = _request.body as { email: string };
    
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
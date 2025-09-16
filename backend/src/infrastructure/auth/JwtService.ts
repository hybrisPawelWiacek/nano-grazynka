import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface JwtPayload {
  userId: string;
  email: string;
  tier: string;
  iat?: number;
  exp?: number;
  jti?: string; // JWT ID for token tracking
}

export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
}

export class JwtService {
  private readonly secret: string;
  private readonly refreshSecret: string;
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;

  constructor() {
    // Use secure secret or generate one if not provided
    this.secret = process.env.JWT_SECRET || this.generateSecureSecret();
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || this.generateSecureSecret();
    this.accessTokenExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m'; // Shorter for better security
    this.refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    
    // Warn if using default secrets in production
    if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
      console.warn('⚠️  WARNING: Using generated JWT secret in production. Set JWT_SECRET environment variable.');
    }
  }

  private generateSecureSecret(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  private generateJwtId(): string {
    return crypto.randomUUID();
  }

  sign(payload: JwtPayload, options?: { expiresIn?: string }): string {
    const jwtPayload = {
      ...payload,
      jti: this.generateJwtId(), // Add unique JWT ID
    };

    return jwt.sign(jwtPayload, this.secret, { 
      expiresIn: options?.expiresIn || this.accessTokenExpiresIn,
      issuer: 'nano-grazynka',
      audience: 'nano-grazynka-client',
      algorithm: 'HS256'
    } as jwt.SignOptions);
  }

  signRefreshToken(payload: Pick<JwtPayload, 'userId' | 'email'>): string {
    const jwtPayload = {
      ...payload,
      type: 'refresh',
      jti: this.generateJwtId(),
    };

    return jwt.sign(jwtPayload, this.refreshSecret, { 
      expiresIn: this.refreshTokenExpiresIn,
      issuer: 'nano-grazynka',
      audience: 'nano-grazynka-client',
      algorithm: 'HS256'
    } as jwt.SignOptions);
  }

  verify(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.secret, {
        issuer: 'nano-grazynka',
        audience: 'nano-grazynka-client',
        algorithms: ['HS256']
      }) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, this.refreshSecret, {
        issuer: 'nano-grazynka',
        audience: 'nano-grazynka-client',
        algorithms: ['HS256']
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      } else {
        throw new Error('Refresh token verification failed');
      }
    }
  }

  decode(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  // Get token expiration time
  getTokenExpiration(token: string): Date | null {
    const decoded = this.decode(token);
    if (decoded?.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  }

  // Check if token will expire soon (within 5 minutes)
  isTokenExpiringSoon(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return false;
    
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return expiration <= fiveMinutesFromNow;
  }
}
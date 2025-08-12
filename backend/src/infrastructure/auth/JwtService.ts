import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  email: string;
  tier: string;
}

export class JwtService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '30d';
  }

  sign(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verify(token: string): JwtPayload {
    return jwt.verify(token, this.secret) as JwtPayload;
  }

  decode(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}
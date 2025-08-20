// JWT validation helper for middleware
// This validates tokens without external dependencies since middleware runs in Edge Runtime

export interface TokenPayload {
  userId: string;
  email: string;
  tier: string;
  iat: number;
  exp: number;
}

/**
 * Validates a JWT token by checking its structure and expiration
 * Note: This is a basic validation - full signature verification requires the secret
 * For middleware, we'll rely on the backend to do full validation via API call
 */
export function isTokenValid(token: string): boolean {
  try {
    // Basic JWT structure check
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('Invalid token structure');
      return false;
    }

    // Decode the payload (base64url)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString()
    );

    // Check if token has required fields
    if (!payload.userId || !payload.exp) {
      console.log('Token missing required fields');
      return false;
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.log('Token expired');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

/**
 * Extracts user info from token without full validation
 * Used for displaying user info in UI
 */
export function parseToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString()
    );

    return payload as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Validates token via backend API call
 * This is the most secure method but requires an API call
 */
export async function validateTokenWithBackend(token: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`,
      },
      credentials: 'include',
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Clears authentication by calling logout endpoint
 * This is required for httpOnly cookies
 */
export async function clearAuthCookie(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Failed to clear auth cookie:', error);
  }
}
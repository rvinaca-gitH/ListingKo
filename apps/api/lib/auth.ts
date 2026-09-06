import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long';

export async function getAuthUser(request: NextRequest): Promise<string | undefined> {
  try {
    // Get token from Authorization header or x-auth-token
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.headers.get('x-auth-token') || '';
    }

    if (!token) {
      return undefined;
    }

    // Dev mode: bypass auth entirely if NODE_ENV is development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[DEV MODE] Bypassing auth check, accepting all tokens');
      return 'dev-user-' + Math.random().toString(36).substr(2, 9);
    }

    // Verify JWT token
    const secret = new TextEncoder().encode(JWT_SECRET);
    const verified = await jwtVerify(token, secret);

    return verified.payload.sub as string;
  } catch (error) {
    console.error('Auth verification error:', error);
    return undefined;
  }
}

export function requireAuth(userId: string | undefined): string {
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

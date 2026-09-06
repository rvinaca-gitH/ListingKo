import { NextRequest } from 'next/server';

export async function getAuthUser(request: NextRequest): Promise<string | undefined> {
  // TEMPORARY DEV MODE: bypass all auth checks for testing
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                request.headers.get('x-auth-token') || '';

  if (!token) {
    return undefined;
  }

  // Accept any token in dev mode - use consistent dev user ID
  console.log('[AUTH] TEMPORARY DEV BYPASS - accepting token');
  return '00000000-0000-0000-0000-000000000001';
}

export function requireAuth(userId: string | undefined): string {
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

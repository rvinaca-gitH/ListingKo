import { NextRequest } from 'next/server';
import { supabase } from '@/lib/database';

export async function getAuthUser(request: NextRequest): Promise<string | undefined> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : request.headers.get('x-auth-token')?.trim();

  if (!token) {
    return undefined;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return undefined;
  }

  return data.user.id;
}

export function requireAuth(userId: string | undefined): string {
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

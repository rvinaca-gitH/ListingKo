import { NextRequest } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
}

export async function getAuthUser(request: NextRequest, supabase: SupabaseClient): Promise<AuthUser | undefined> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : undefined;

  if (!token) {
    return undefined;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user || !data.user.email) {
    return undefined;
  }

  return { id: data.user.id, email: data.user.email };
}

// Real sign-ins land in auth.users, but nothing provisions a matching row in
// public.users (only the hardcoded dev user has one, from a migration seed).
// Several tables FK to public.users, so any real-user write needs this first.
export async function ensurePublicUser(supabase: SupabaseClient, user: AuthUser): Promise<void> {
  await supabase.from('users').upsert({ id: user.id, email: user.email }, { onConflict: 'id' });
}

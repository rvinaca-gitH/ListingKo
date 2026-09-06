import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Dev mode: Mock auth when Supabase is unavailable (e.g., Docker not running)
if (process.env.NEXT_PUBLIC_ENV === 'development') {
  const originalGetSession = supabase.auth.getSession;
  const originalSignInAnonymously = supabase.auth.signInAnonymously;
  const originalSignOut = supabase.auth.signOut;

  // Intercept calls and provide mock data if real Supabase fails
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supabase.auth as any).getSession = async function() {
    try {
      return await originalGetSession.call(this);
    } catch (error) {
      console.warn('[DEV MODE] Supabase unavailable, using mock session');
      const mockSession = {
        user: {
          id: 'dev-user-' + Math.random().toString(36).substr(2, 9),
          email: 'dev@listingko.local',
          user_metadata: {},
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
        session: null,
      };
      return { data: mockSession, error: null };
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supabase.auth as any).signInAnonymously = async function() {
    try {
      return await originalSignInAnonymously.call(this);
    } catch (error) {
      console.warn('[DEV MODE] Supabase unavailable, using mock sign-in');
      const mockUser = {
        id: 'dev-user-' + Math.random().toString(36).substr(2, 9),
        email: 'dev@listingko.local',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };
      return { data: { user: mockUser, session: null }, error: null };
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supabase.auth as any).signOut = async function() {
    try {
      return await originalSignOut.call(this);
    } catch (error) {
      console.warn('[DEV MODE] Supabase unavailable, mock sign-out');
      return { error: null };
    }
  };
}

export { supabase };

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [email, setEmail] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [signInError, setSignInError] = useState('');
  const router = useRouter();

  // Authentication is checked once when the landing page mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        router.push('/dashboard');
      } else if (process.env.NEXT_PUBLIC_ENV === 'development') {
        // In development mode, skip auth and go to dashboard
        setTimeout(() => router.push('/dashboard'), 100);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // In development, bypass auth errors
      if (process.env.NEXT_PUBLIC_ENV === 'development') {
        setTimeout(() => router.push('/dashboard'), 100);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setSignInError('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setLinkSent(true);
    } catch (error) {
      console.error('Sign in failed:', error);
      setSignInError(error instanceof Error ? error.message : 'Failed to send sign-in link. Try again.');
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2 text-gray-900">ListingKo</h1>
          <p className="text-lg text-gray-600">
            AI Ecommerce Product Launch Factory
          </p>
          <p className="text-sm text-gray-500 mt-2">
            One product in → complete launch package out
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Welcome</h2>
          <p className="text-gray-600 mb-6">
            Sign in to create and manage your product listings powered by AI.
          </p>

          {linkSent ? (
            <div className="text-center py-4">
              <p className="text-green-700 font-medium mb-1">Check your email!</p>
              <p className="text-sm text-gray-600">We sent a sign-in link to {email}</p>
            </div>
          ) : (
            <form onSubmit={handleSignIn} className="mb-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {signInError && (
                <p className="text-sm text-red-600 mb-3">{signInError}</p>
              )}
              <button
                type="submit"
                disabled={signingIn}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold transition"
              >
                {signingIn ? 'Sending link...' : 'Get Started'}
              </button>
            </form>
          )}

          <div className="space-y-3 mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-start">
              <div className="text-2xl mr-3">✨</div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Analysis</h3>
                <p className="text-sm text-gray-600">Intelligent product understanding</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="text-2xl mr-3">🌍</div>
              <div>
                <h3 className="font-semibold text-gray-900">Multi-Platform</h3>
                <p className="text-sm text-gray-600">Shopee, Lazada, TikTok Shop & Facebook</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="text-2xl mr-3">✅</div>
              <div>
                <h3 className="font-semibold text-gray-900">Quality Assurance</h3>
                <p className="text-sm text-gray-600">Automated QA and scoring</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="text-2xl mr-3">📦</div>
              <div>
                <h3 className="font-semibold text-gray-900">Complete Package</h3>
                <p className="text-sm text-gray-600">Everything ready to publish</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

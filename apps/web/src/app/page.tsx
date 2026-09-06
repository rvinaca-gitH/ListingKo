'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      router.push('/dashboard');
    } catch (error) {
      console.error('Sign in failed:', error);
      if (process.env.NEXT_PUBLIC_ENV === 'development') {
        router.push('/dashboard');
      } else {
        alert('Failed to sign in. Try again.');
      }
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

          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold transition mb-4"
          >
            {signingIn ? 'Signing in...' : 'Get Started'}
          </button>

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

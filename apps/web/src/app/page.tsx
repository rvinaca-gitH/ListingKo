'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ProductForm from '@/components/product-form';

export default function Home() {
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Auth check - session is:', session ? 'exists' : 'null');
      if (session?.user) {
        console.log('Auth check - user ID:', session.user.id);
        console.log('Auth check - user email:', session.user.email);
      }
      setUser(session?.user || null);
    } catch (error) {
      console.error('Auth check failed:', error);
      // In dev mode with no Supabase, start with no user (user will use mock sign-in)
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      setUser(data.user);
    } catch (error) {
      console.error('Sign in failed:', error);
      // Dev mode fallback: create mock user when Supabase is unavailable
      if (process.env.NEXT_PUBLIC_ENV === 'development') {
        console.warn('[DEV MODE] Using mock user - Supabase unavailable');
        const mockUser = {
          id: 'dev-user-' + Math.random().toString(36).substr(2, 9),
          email: 'dev@listingko.local',
          user_metadata: {},
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setUser(mockUser as any);
      } else {
        alert('Failed to sign in. Try again.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setCreatedProductId(null);
    } catch (error) {
      console.error('Sign out failed:', error);
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
    <main className="flex min-h-screen flex-col p-8">
      <div className="max-w-4xl mx-auto w-full">
        {/* DEBUG BANNER */}
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded text-sm">
          DEBUG: user={user ? `"${user.id}"` : 'null'} | loading={loading} | signingIn={signingIn}
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">ListingKo</h1>
          <p className="text-xl text-gray-600 mb-2">
            AI Ecommerce Product Launch Factory
          </p>
          <p className="text-lg text-gray-700">
            One product in → complete launch package out
          </p>
          {user && (
            <p className="text-sm text-gray-500 mt-4">
              Signed in as {user.email || 'Anonymous User'}
              <button
                onClick={handleSignOut}
                className="ml-3 text-blue-600 hover:underline"
              >
                Sign out
              </button>
            </p>
          )}
        </div>

        {!user ? (
          <div className="max-w-md mx-auto mb-12 text-center">
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-8">
              <h2 className="text-2xl font-bold mb-4 text-blue-900">Welcome to ListingKo</h2>
              <p className="text-gray-700 mb-6">
                Sign in to create and manage your product listings.
              </p>
              <button
                onClick={handleSignIn}
                disabled={signingIn}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium transition"
              >
                {signingIn ? 'Signing in...' : 'Get Started'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">Create New Product</h2>
              <ProductForm onProductCreated={setCreatedProductId} />
            </div>

          {/* Info Section */}
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">How It Works</h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li>1. <span className="font-medium">Create Product</span> - Enter basic product details</li>
                <li>2. <span className="font-medium">AI Analysis</span> - We analyze and create a Product Master</li>
                <li>3. <span className="font-medium">Generate Listings</span> - Create platform-specific content</li>
                <li>4. <span className="font-medium">QA & Scoring</span> - Automatic quality evaluation</li>
                <li>5. <span className="font-medium">Export</span> - Download your complete launch package</li>
              </ol>
            </div>

            {createdProductId && (
              <div className="bg-green-50 rounded-lg border border-green-200 p-6">
                <h3 className="text-lg font-semibold mb-2 text-green-900">Product Created!</h3>
                <p className="text-sm text-green-800">
                  Product ID: <code className="bg-white px-2 py-1 rounded font-mono text-xs">{createdProductId}</code>
                </p>
                <p className="text-sm text-green-700 mt-2">
                  You can now analyze this product and generate listings.
                </p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-3">Features</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✨ AI-powered product analysis</li>
                <li>🌍 Multi-platform listing generation</li>
                <li>✅ Automated QA and scoring</li>
                <li>🚀 One-click export ready</li>
              </ul>
            </div>
          </div>
        </div>
        )}
      </div>
    </main>
  );
}

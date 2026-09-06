'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // In dev mode, create mock user
        if (process.env.NEXT_PUBLIC_ENV === 'development') {
          const mockUser = {
            id: 'dev-user-' + Math.random().toString(36).substr(2, 9),
            email: 'dev@listingko.local',
          };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setUser(mockUser as any);
        } else {
          router.push('/');
        }
      } else {
        setUser(session.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // In dev mode, allow access with mock user
      if (process.env.NEXT_PUBLIC_ENV === 'development') {
        const mockUser = {
          id: 'dev-user-' + Math.random().toString(36).substr(2, 9),
          email: 'dev@listingko.local',
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setUser(mockUser as any);
      } else {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-8 py-4 flex items-center justify-between">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search products, keywords, or tools..."
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex items-center gap-6 ml-6">
              <button className="text-gray-600 hover:text-gray-900 text-lg">
                🔔
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {user?.email?.[0]?.toUpperCase() || 'R'}
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">Pro Plan</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

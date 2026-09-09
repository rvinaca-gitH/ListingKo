'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const MENU_ITEMS = [
  { id: 'home', label: 'Home', icon: '🏠', href: '/dashboard' },
  { id: 'products', label: 'Products', icon: '📦', href: '/dashboard/products' },
  { id: 'create', label: 'Create with AI', icon: '✨', href: '/dashboard/create' },
  { id: 'assets', label: 'Assets', icon: '🖼️', href: '/dashboard/assets' },
  { id: 'seo', label: 'SEO & QA', icon: '📊', href: '/dashboard/seo-qa' },
  { id: 'export', label: 'Export', icon: '📥', href: '/dashboard/export' },
  { id: 'marketplace', label: 'Marketplace', icon: '🌍', href: '/dashboard/marketplace' },
  { id: 'analytics', label: 'Analytics', icon: '📈', href: '/dashboard/analytics' },
  { id: 'integrations', label: 'Integrations', icon: '🔗', href: '/dashboard/integrations' },
  { id: 'learning', label: 'Learning Hub', icon: '📚', href: '/dashboard/learning' },
  { id: 'settings', label: 'Settings', icon: '⚙️', href: '/dashboard/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      router.push('/');
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="text-2xl font-bold">
            <span className="text-orange-500">Listing</span>
            <span className="text-orange-600">Ko</span>
          </div>
        </Link>
        <p className="text-xs text-gray-500 mt-1">Create once. Sell everywhere.</p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
              isActive(item.href)
                ? 'bg-orange-50 text-orange-600 font-semibold'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Upgrade Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">👑</div>
          <h3 className="font-semibold text-gray-900 text-sm mb-1">Upgrade to Pro</h3>
          <p className="text-xs text-gray-600 mb-3">Unlock more features and higher limits.</p>
          <button className="w-full bg-orange-500 text-white py-2 rounded-lg text-xs font-semibold hover:bg-orange-600 transition">
            Upgrade Now
          </button>
        </div>
      </div>

      {/* Sign Out */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="w-full text-sm text-gray-600 hover:text-gray-900 py-2 transition"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

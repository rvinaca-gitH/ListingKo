'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@listingko/shared-types';
import { apiClient } from '@/lib/api-client';

const QUICK_ACTIONS = [
  { id: 'image-studio', label: 'AI Image Studio', icon: '🎨', href: '#' },
  { id: 'seo-keywords', label: 'SEO & Keywords', icon: '🔍', href: '#' },
  { id: 'listing-qa', label: 'Listing QA', icon: '✅', href: '#' },
  { id: 'export-center', label: 'Export Center', icon: '📥', href: '#' },
  { id: 'my-assets', label: 'My Assets', icon: '🖼️', href: '#' },
];

const PROGRESS_ITEMS = [
  { label: 'Complete product details', completed: true },
  { label: 'Add at least 5 photos', completed: true },
  { label: 'Include dimensions', completed: false },
  { label: 'Optimize SEO keywords', completed: true },
];

const TIPS = [
  {
    id: 1,
    title: 'Better photos, more sales!',
    description: 'Try our AI Image Studio to create professional product photos in seconds.',
    icon: '📸',
  },
];

export default function DashboardHomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    readyToExport: 0,
    drafts: 0,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getProducts();
      if (response.success && response.data) {
        const allProducts = response.data.items || [];
        setProducts(allProducts);

        // Calculate stats
        const readyToExport = allProducts.filter((p) => p.status === 'READY').length;
        const drafts = allProducts.filter((p) => p.status === 'DRAFT').length;

        setStats({
          total: allProducts.length,
          readyToExport,
          drafts,
        });
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgressPercentage = () => {
    // % of products with listings generated
    // For demo, calculate based on products with status !== DRAFT
    const withListings = products.filter((p) => p.status !== 'DRAFT').length;
    return products.length > 0 ? Math.round((withListings / products.length) * 100) : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'ANALYZING':
        return 'bg-blue-100 text-blue-800';
      case 'READY':
        return 'bg-green-100 text-green-800';
      case 'PUBLISHED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Greeting Section */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm">Good morning,</p>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Rvin!</h1>
          <p className="text-gray-600">Turn your products into ready-to-sell listings with AI.</p>
          <p className="text-orange-500 font-semibold italic">List Smarter. Sell More.</p>
        </div>
        <div>
          <Link
            href="/dashboard/settings/marketplace"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition"
          >
            ⚙️ Marketplace Settings
          </Link>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 w-64">
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">One product. Endless possibilities.</p>
          </div>
          <div className="flex justify-between items-center gap-3 mb-4">
            <div className="flex-1 flex items-center justify-center bg-white rounded p-2">
              <span className="text-2xl">🛒</span>
            </div>
            <div className="flex-1 flex items-center justify-center bg-white rounded p-2">
              <span className="text-2xl">❤️</span>
            </div>
            <div className="flex-1 flex items-center justify-center bg-white rounded p-2">
              <span className="text-2xl">♪</span>
            </div>
            <div className="flex-1 flex items-center justify-center bg-white rounded p-2">
              <span className="text-2xl">f</span>
            </div>
          </div>
          <p className="text-xs text-gray-600">Shopee | Lazada | TikTok Shop | Facebook Shop</p>
          <p className="text-xs text-gray-600 mt-2">Create once. Export everywhere.</p>
        </div>
      </div>

      {/* Create Button */}
      <Link href="/dashboard/products" className="inline-block">
        <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition flex items-center gap-2">
          <span>✨</span>
          Create New Listing
        </button>
      </Link>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Products</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <span className="text-3xl">📦</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Ready to Export</p>
              <p className="text-3xl font-bold text-green-600">{stats.readyToExport}</p>
            </div>
            <span className="text-3xl">✅</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Drafts</p>
              <p className="text-3xl font-bold text-orange-600">{stats.drafts}</p>
            </div>
            <span className="text-3xl">📝</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Potential Sales</p>
              <p className="text-3xl font-bold text-blue-600">—</p>
              <p className="text-xs text-gray-500 mt-1">v2 feature</p>
            </div>
            <span className="text-3xl">💰</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-5 gap-4">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.id} href={action.href}>
              <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg hover:border-orange-300 transition cursor-pointer text-center">
                <div className="text-3xl mb-3">{action.icon}</div>
                <p className="text-sm font-medium text-gray-900">{action.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Your Progress</h3>
            <Link href="#" className="text-sm text-blue-600 hover:text-blue-700">
              View Goals →
            </Link>
          </div>

          {/* Progress Circle */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="8"
                  strokeDasharray={`${calculateProgressPercentage() * 2.83} 283`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-3xl font-bold text-orange-500">{calculateProgressPercentage()}%</p>
                <p className="text-xs text-gray-600">Listing Readiness</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Checklist */}
        <div className="col-span-2 bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Listing Readiness Checklist</h3>
          <div className="space-y-3">
            {PROGRESS_ITEMS.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    item.completed
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {item.completed && <span className="text-white text-sm">✓</span>}
                </div>
                <p className={item.completed ? 'text-gray-600 line-through' : 'text-gray-900'}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Tips for Success</h3>
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
          <div className="flex items-start gap-4">
            <span className="text-3xl">{TIPS[0].icon}</span>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{TIPS[0].title}</h4>
              <p className="text-sm text-gray-600 mt-1">{TIPS[0].description}</p>
            </div>
            <Link href="#" className="text-orange-600 hover:text-orange-700 font-semibold text-sm whitespace-nowrap">
              Learn More →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Products Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Recent Products</h3>
          <Link href="/dashboard/products" className="text-sm text-blue-600 hover:text-blue-700">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-600">No products yet. Create your first listing to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Product</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">SEO Score</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Marketplaces</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Updated</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map((product) => (
                  <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/products/${product.id}`}>
                        <div className="flex items-center gap-3 cursor-pointer hover:text-orange-600">
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-lg">
                            📦
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.title}</p>
                            <p className="text-xs text-gray-500">SKU: {product.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(product.status)}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: `${Math.random() * 100}%` }}></div>
                        </div>
                        <p className="text-sm text-gray-900">{Math.floor(Math.random() * 100)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <span title="Shopee">🛒</span>
                        <span title="Lazada">❤️</span>
                        <span title="TikTok">♪</span>
                        <span title="Facebook">f</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{new Date(product.updated_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-gray-600">⋮</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

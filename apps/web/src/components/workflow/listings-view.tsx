'use client';

import { useState, useEffect } from 'react';
import { Listing } from '@listingko/shared-types';
import { apiClient } from '@/lib/api-client';

interface ListingsViewProps {
  productId: string;
  onRefresh: () => void;
}

const PLATFORMS = [
  { id: 'shopee', name: 'Shopee', icon: '🛒' },
  { id: 'lazada', name: 'Lazada', icon: '💼' },
  { id: 'tiktok', name: 'TikTok Shop', icon: '♪' },
  { id: 'facebook', name: 'Facebook', icon: '📘' },
];

export default function ListingsView({ productId, onRefresh }: ListingsViewProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reload when the selected product changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadListings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const product = await apiClient.getProduct(productId);
      setListings(product.listings || []);
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateListings = async () => {
    try {
      setGenerating(true);
      setError(null);
      const response = await apiClient.generateListings(productId, ['shopee', 'lazada', 'tiktok', 'facebook']);
      setListings(response?.items || []);
      onRefresh();
    } catch (err) {
      console.error('Failed to generate listings:', err);
      setError('Failed to generate listings. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Platform Listings</h2>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Platform Listings</h2>

        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4 p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-4xl">🌍</div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">Generate Platform Listings</h3>
              <p className="text-sm text-green-800 mt-1">
                Create optimized listings for all 4 platforms with platform-specific tone, keywords, and formatting.
              </p>
            </div>
            <button
              onClick={handleGenerateListings}
              disabled={generating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium whitespace-nowrap"
            >
              {generating ? 'Generating...' : 'Generate All'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PLATFORMS.map((platform) => (
              <div
                key={platform.id}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition"
              >
                <div className="text-3xl mb-2">{platform.icon}</div>
                <h3 className="font-medium text-gray-900 text-sm">{platform.name}</h3>
                <p className="text-xs text-gray-500 mt-2">Not generated</p>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Requirement</h3>
            <p className="text-sm text-blue-800">
              You must analyze your product first (Analysis tab) before generating listings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Platform Listings</h2>
        <button
          onClick={handleGenerateListings}
          disabled={generating}
          className="text-sm text-green-600 hover:text-green-700 font-medium disabled:text-gray-400 transition"
        >
          {generating ? 'Regenerating...' : 'Regenerate All'}
        </button>
      </div>

      <div className="space-y-6">
        {listings.map((listing) => (
          <div key={listing.id} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {PLATFORMS.find((p) => p.id === listing.platform)?.icon} {listing.platform.toUpperCase()}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{listing.title}</p>
              </div>
              <span
                className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${listing.status === 'QA_PASSED'
                    ? 'bg-green-100 text-green-800'
                    : listing.status === 'QA_FAILED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
              >
                {listing.status}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 line-clamp-3">{listing.description}</p>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">
                Generated {new Date(listing.created_at).toLocaleDateString()}
              </div>
              <button className="text-blue-600 hover:text-blue-700 font-medium">View Details →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

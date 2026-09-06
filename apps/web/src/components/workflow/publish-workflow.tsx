'use client';

import { useState, useEffect } from 'react';
import { Listing } from '@listingko/shared-types';
import { apiClient } from '@/lib/api-client';

interface PublishWorkflowProps {
  listings: Listing[];
  productId: string;
}

const MARKETPLACES = [
  { id: 'shopee', name: 'Shopee', icon: '🛒' },
  { id: 'lazada', name: 'Lazada', icon: '💼' },
  { id: 'tiktok', name: 'TikTok Shop', icon: '♪' },
  { id: 'facebook', name: 'Facebook', icon: '📘' },
];

export default function PublishWorkflow({ listings, productId }: PublishWorkflowProps) {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const conns = await apiClient.getMarketplaceConnections();
      setConnections(conns);
    } catch (err) {
      console.error('Failed to load connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedListing || !selectedConnection) return;

    try {
      setPublishing(selectedListing);
      await apiClient.publishListing(selectedListing, selectedConnection);
      // Refresh listings would happen here via parent callback
      setSelectedListing(null);
      setSelectedConnection(null);
    } catch (err) {
      console.error('Publish failed:', err);
    } finally {
      setPublishing(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Publish to Marketplaces</h2>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const readyListings = listings.filter((l) => l.qa_passed && l.status === 'QA_PASSED');
  const publishedListings = listings.filter((l) => l.status === 'PUBLISHED');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold mb-6 text-gray-900">Publish to Marketplaces</h2>

      <div className="space-y-6">
        {connections.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>No marketplaces connected.</strong>{' '}
              <a href="/dashboard/settings/marketplace" className="text-yellow-900 underline font-semibold">
                Connect a marketplace first
              </a>
            </p>
          </div>
        ) : (
          <>
            {/* Already Published */}
            {publishedListings.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm text-green-700">✓ Published</h3>
                <div className="space-y-2">
                  {publishedListings.map((listing) => (
                    <div key={listing.id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-lg">
                        {MARKETPLACES.find((m) => m.id === listing.platform)?.icon}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{listing.platform.toUpperCase()}</p>
                        <p className="text-xs text-gray-600">ID: {listing.platform_listing_id}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">Live</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ready to Publish */}
            {readyListings.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Ready to Publish</h3>
                <div className="space-y-4">
                  {readyListings.map((listing) => (
                    <div key={listing.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {MARKETPLACES.find((m) => m.id === listing.platform)?.icon}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900">{listing.platform.toUpperCase()}</p>
                            <p className="text-xs text-gray-600 line-clamp-1">{listing.title}</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">Ready</span>
                      </div>

                      {selectedListing === listing.id ? (
                        <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <label className="block text-sm font-medium text-gray-700">Select Marketplace Account</label>
                          <select
                            value={selectedConnection || ''}
                            onChange={(e) => setSelectedConnection(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="">Choose a marketplace...</option>
                            {connections
                              .filter((c) => c.marketplace === listing.platform)
                              .map((conn) => (
                                <option key={conn.id} value={conn.id}>
                                  {conn.shop_name} ({conn.status})
                                </option>
                              ))}
                          </select>

                          <div className="flex gap-2">
                            <button
                              onClick={handlePublish}
                              disabled={publishing !== null || !selectedConnection}
                              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition"
                            >
                              {publishing === listing.id ? 'Publishing...' : 'Publish Now'}
                            </button>
                            <button
                              onClick={() => setSelectedListing(null)}
                              className="flex-1 px-3 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium text-sm transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedListing(listing.id)}
                          className="w-full px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg font-medium border border-green-200 transition"
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {readyListings.length === 0 && publishedListings.length === 0 && (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600">
                  Generate and pass QA on listings before publishing to marketplaces.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

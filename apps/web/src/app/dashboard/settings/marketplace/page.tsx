'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

const MARKETPLACES = [
  { id: 'shopee', name: 'Shopee', icon: '🛒', color: 'red' },
  { id: 'lazada', name: 'Lazada', icon: '💼', color: 'blue' },
  { id: 'tiktok', name: 'TikTok Shop', icon: '♪', color: 'black' },
  { id: 'facebook', name: 'Facebook', icon: '📘', color: 'blue' },
];

export default function MarketplaceSettings() {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    shopId: '',
    shopName: '',
    apiKey: '',
    apiSecret: '',
  });

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

  const handleConnect = async (marketplace: string) => {
    try {
      setConnecting(marketplace);
      const connection = await apiClient.createMarketplaceConnection({
        marketplace,
        shopId: formData.shopId,
        shopName: formData.shopName,
        credentials: {
          apiKey: formData.apiKey,
          apiSecret: formData.apiSecret,
        },
      });
      setConnections([...connections, connection]);
      setShowForm(null);
      setFormData({ shopId: '', shopName: '', apiKey: '', apiSecret: '' });
    } catch (err) {
      console.error('Connection failed:', err);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Disconnect this marketplace?')) return;
    try {
      await apiClient.deleteMarketplaceConnection(connectionId);
      setConnections(connections.filter((c) => c.id !== connectionId));
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  };

  const isConnected = (marketplace: string) => {
    return connections.some((c) => c.marketplace === marketplace && c.status === 'CONNECTED');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketplace Integrations</h1>
          <p className="text-gray-600">Connect your product listings to multiple marketplaces</p>
        </div>

        {/* Connected Marketplaces */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Connected Marketplaces</h2>

          {connections.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No marketplaces connected yet</p>
          ) : (
            <div className="space-y-4">
              {connections.map((conn) => (
                <div key={conn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {MARKETPLACES.find((m) => m.id === conn.marketplace)?.name}
                    </h3>
                    {conn.shop_name && <p className="text-sm text-gray-600 mt-1">Shop: {conn.shop_name}</p>}
                    <p className="text-xs text-gray-500 mt-1">Connected {new Date(conn.created_at).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => handleDisconnect(conn.id)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm transition"
                  >
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Marketplaces */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Available Marketplaces</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MARKETPLACES.map((marketplace) => {
              const connected = isConnected(marketplace.id);
              const showingForm = showForm === marketplace.id;

              return (
                <div key={marketplace.id} className="border-2 border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{marketplace.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-900">{marketplace.name}</h3>
                  </div>

                  {connected ? (
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      ✓ Connected
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {showingForm && (
                        <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <input
                            type="text"
                            placeholder="Shop ID"
                            value={formData.shopId}
                            onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Shop Name"
                            value={formData.shopName}
                            onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="password"
                            placeholder="API Key"
                            value={formData.apiKey}
                            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="password"
                            placeholder="API Secret"
                            value={formData.apiSecret}
                            onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleConnect(marketplace.id)}
                              disabled={connecting !== null}
                              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition"
                            >
                              {connecting === marketplace.id ? 'Connecting...' : 'Connect'}
                            </button>
                            <button
                              onClick={() => setShowForm(null)}
                              className="flex-1 px-3 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium text-sm transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {!showingForm && (
                        <button
                          onClick={() => setShowForm(marketplace.id)}
                          className="w-full px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium border border-blue-200 transition"
                        >
                          Connect Now
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="font-semibold text-blue-900 mb-2">About Marketplace Integrations</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Connect your shop accounts to publish listings directly from ListingKo</li>
            <li>• Credentials are encrypted and stored securely</li>
            <li>• You can manage multiple shops and platforms</li>
            <li>• Publishing will begin in Phase 4.1</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

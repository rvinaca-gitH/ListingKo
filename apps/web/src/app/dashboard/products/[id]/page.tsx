'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Product } from '@listingko/shared-types';
import { apiClient } from '@/lib/api-client';
import ProductOverview from '@/components/workflow/product-overview';
import ProductMasterView from '@/components/workflow/product-master-view';
import ListingsView from '@/components/workflow/listings-view';
import ImagesView from '@/components/workflow/images-view';
import QAResultsView from '@/components/workflow/qa-results-view';
import ExportView from '@/components/workflow/export-view';

type Tab = 'overview' | 'analysis' | 'listings' | 'images' | 'qa' | 'export';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Reload when the selected product or refresh trigger changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, refreshTrigger]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      // For now, we'll fetch products list and find the one with matching ID
      // When we have individual product endpoints, we'll use those
      const response = await apiClient.getProducts();
      if (response.success && response.data) {
        const found = response.data.items?.find((p) => p.id === productId);
        if (found) {
          setProduct(found);
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'analysis', label: 'Analysis', icon: '🔍' },
    { id: 'listings', label: 'Listings', icon: '🌍' },
    { id: 'images', label: 'Images', icon: '🖼️' },
    { id: 'qa', label: 'QA', icon: '✅' },
    { id: 'export', label: 'Export', icon: '📦' },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-gray-600">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-gray-600">Product not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 transition"
        >
          ← Back to Products
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
        <p className="text-gray-600">
          Created {new Date(product.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Status Badge */}
      <div className="mb-6 flex items-center gap-4">
        <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
          {product.status}
        </span>
      </div>

      {/* Workflow Progress */}
      <div className="mb-8 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'border-b-2 border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <ProductOverview product={product} onRefresh={handleRefresh} />
        )}
        {activeTab === 'analysis' && (
          <ProductMasterView productId={productId} onRefresh={handleRefresh} />
        )}
        {activeTab === 'listings' && (
          <ListingsView productId={productId} onRefresh={handleRefresh} />
        )}
        {activeTab === 'images' && (
          <ImagesView productId={productId} onRefresh={handleRefresh} />
        )}
        {activeTab === 'qa' && (
          <QAResultsView productId={productId} onRefresh={handleRefresh} />
        )}
        {activeTab === 'export' && (
          <ExportView productId={productId} onRefresh={handleRefresh} />
        )}
      </div>
    </div>
  );
}

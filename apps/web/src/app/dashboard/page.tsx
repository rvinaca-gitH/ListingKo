'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@listingko/shared-types';
import { apiClient } from '@/lib/api-client';
import ProductForm from '@/components/product-form';

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getProducts();
      if (response.success && response.data) {
        setProducts(response.data.items || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductCreated = (productId: string) => {
    setCreatedProductId(productId);
    setShowForm(false);
    loadProducts();
    setTimeout(() => setCreatedProductId(null), 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
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
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Products</h1>
        <p className="text-gray-600">
          Create and manage product listings for your ecommerce store.
        </p>
      </div>

      {/* Success Message */}
      {createdProductId && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">
            ✓ Product created successfully! <code className="bg-white px-2 py-1 rounded text-xs font-mono">{createdProductId}</code>
          </p>
        </div>
      )}

      {/* Action Bar */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <p className="text-gray-600">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          {showForm ? 'Cancel' : 'Create New Product'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Create New Product</h2>
          <ProductForm onProductCreated={handleProductCreated} />
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first product to get started with ListingKo
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Create Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/dashboard/products/${product.id}`}>
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition cursor-pointer h-full flex flex-col">
                <div className="mb-4 flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {product.description || 'No description'}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(product.status)}`}>
                    {product.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

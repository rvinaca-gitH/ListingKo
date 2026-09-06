import { Product } from '@listingko/shared-types';
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface ProductOverviewProps {
  product: Product;
  onRefresh: () => void;
}

export default function ProductOverview({ product, onRefresh }: ProductOverviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: product.title,
    description: product.description || '',
    category: product.category || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiClient.updateProduct(product.id, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
      });
      if (response.success) {
        setIsEditing(false);
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-900">Edit Product</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  title: product.title,
                  description: product.description || '',
                  category: product.category || '',
                });
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
        <button
          onClick={() => setIsEditing(true)}
          className="text-sm text-blue-600 hover:text-blue-700 transition font-medium"
        >
          Edit
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Title</h3>
          <p className="text-lg text-gray-900">{product.title}</p>
        </div>

        {product.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
          </div>
        )}

        {product.category && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Category</h3>
            <p className="text-gray-700">{product.category}</p>
          </div>
        )}

        <div className="pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
              <p className="text-gray-900 font-medium">{product.status}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
              <p className="text-gray-900">
                {new Date(product.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">Next Step</h3>
          <p className="text-sm text-blue-800">
            {product.status === 'DRAFT'
              ? 'Upload photos and click "Analyze" to create your Product Master.'
              : product.status === 'ANALYZING'
              ? 'AI is analyzing your product. This may take a few minutes.'
              : product.status === 'READY'
              ? 'Generate listings for your favorite platforms.'
              : 'Your product is published! Check the Export tab for your complete package.'}
          </p>
        </div>
      </div>
    </div>
  );
}

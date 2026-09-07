'use client';

import { useState, useEffect } from 'react';
import { ProductMaster } from '@listingko/shared-types';
import { apiClient } from '@/lib/api-client';

interface ProductMasterViewProps {
  productId: string;
  onRefresh: () => void;
}

export default function ProductMasterView({ productId, onRefresh }: ProductMasterViewProps) {
  const [master, setMaster] = useState<ProductMaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reload when the selected product changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadProductMaster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const loadProductMaster = async () => {
    try {
      setLoading(true);
      setError(null);
      const product = await apiClient.getProduct(productId);
      setMaster(product.productMaster || null);
    } catch (err) {
      console.error('Failed to load Product Master:', err);
      setError('Failed to load Product Master');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      console.log('Starting analyze for product:', productId);
      const response = await apiClient.analyzeProduct(productId);
      console.log('Analyze response:', response);

      if (response && response.data) {
        setMaster(response.data);
        onRefresh();
      } else if (response) {
        // Response might be the data directly
        setMaster(response);
        onRefresh();
      } else {
        throw new Error('No data returned from analysis');
      }
    } catch (err) {
      console.error('Failed to analyze product:', err);
      setError(`Failed to analyze product: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Product Analysis</h2>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!master) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Product Analysis</h2>

        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-4xl">🔍</div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">AI Product Analysis</h3>
              <p className="text-sm text-blue-800 mt-1">
                Click &quot;Analyze&quot; to let AI extract product insights, identify strengths, and generate SEO keywords.
              </p>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium whitespace-nowrap"
            >
              {analyzing ? 'Analyzing...' : 'Analyze Product'}
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">Product Master will contain:</p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✓ Product SKU & naming</li>
              <li>✓ Key strengths & benefits</li>
              <li>✓ Target customer & use cases</li>
              <li>✓ SEO keywords & optimization</li>
              <li>✓ Specifications & features</li>
              <li>✓ Safety & claim validation</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Product Analysis</h2>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 transition"
        >
          {analyzing ? 'Re-analyzing...' : 'Re-analyze'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">SKU</h3>
            <p className="text-lg font-semibold text-gray-900">{master.sku}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Product Name</h3>
            <p className="text-lg font-semibold text-gray-900">{master.name}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
          <p className="text-gray-700">{master.description}</p>
        </div>

        {master.strengths && master.strengths.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Key Strengths</h3>
            <div className="flex flex-wrap gap-2">
              {master.strengths.map((strength, idx) => (
                <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  ✓ {strength}
                </span>
              ))}
            </div>
          </div>
        )}

        {master.target_customer && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Target Customer</h3>
            <p className="text-gray-700">{master.target_customer}</p>
          </div>
        )}

        {master.keywords && master.keywords.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">SEO Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {master.keywords.map((keyword, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {master.seo_score && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">SEO Score</h3>
            <div className="flex items-center gap-3">
              <div className="w-24 h-24 rounded-full bg-white border-4 border-blue-600 flex items-center justify-center">
                <span className="text-3xl font-bold text-blue-600">{master.seo_score}</span>
              </div>
              <div>
                <p className="text-sm text-blue-800">
                  {master.seo_score >= 80
                    ? 'Excellent SEO optimization'
                    : master.seo_score >= 60
                      ? 'Good SEO optimization'
                      : 'Needs SEO improvement'}
                </p>
                <p className="text-xs text-blue-700 mt-1">Confidence: {master.confidence_score}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

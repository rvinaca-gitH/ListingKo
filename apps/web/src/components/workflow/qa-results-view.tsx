'use client';

import { useState, useEffect } from 'react';
import { QAResult } from '@listingko/shared-types';
import { apiClient } from '@/lib/api-client';

interface QAResultsViewProps {
  productId: string;
  onRefresh: () => void;
}

export default function QAResultsView({ productId, onRefresh: _onRefresh }: QAResultsViewProps) {
  const [qaResults, setQaResults] = useState<QAResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Reload when the selected product changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadQAResults();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const loadQAResults = async () => {
    try {
      setLoading(true);
      const results = await apiClient.getQAResults(productId);
      setQaResults(results);
    } catch (err) {
      console.error('Failed to load QA results:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Quality Assurance</h2>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (qaResults.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Quality Assurance</h2>

        <div className="space-y-6">
          <div className="flex items-center gap-4 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-4xl">✅</div>
            <div>
              <h3 className="font-semibold text-yellow-900">Automatic Quality Scoring</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Every listing is scored across 5 quality dimensions automatically.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Quality Dimensions</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-lg">🎯</span> Fact Accuracy
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">🔍</span> SEO Quality
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">🏪</span> Platform Fit
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">📖</span> Readability
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">⚠️</span> Claim Safety
                </li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Pass Threshold</h3>
              <div className="text-3xl font-bold text-green-600 mb-2">≥ 85/100</div>
              <p className="text-sm text-gray-600">Average score must meet minimum quality standard</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-800">
              Generate listings to see quality scores. Each listing is automatically scored on all dimensions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold mb-6 text-gray-900">Quality Assurance Results</h2>

      <div className="space-y-6">
        {qaResults.map((result) => (
          <div key={result.id} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">QA Score: {result.total_score}/100</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Status: {result.passed ? '✅ PASSED' : '❌ NEEDS REPAIR'}
                </p>
              </div>
              <span
                className={`inline-block px-4 py-2 font-semibold rounded-full ${result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
              >
                {result.total_score >= 85 ? 'PASSED' : 'FAILED'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs text-gray-500 mb-1">Fact Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">{result.fact_accuracy}</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs text-gray-500 mb-1">SEO Quality</p>
                <p className="text-2xl font-bold text-gray-900">{result.seo_quality}</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs text-gray-500 mb-1">Platform Fit</p>
                <p className="text-2xl font-bold text-gray-900">{result.platform_fit}</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs text-gray-500 mb-1">Readability</p>
                <p className="text-2xl font-bold text-gray-900">{result.readability}</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs text-gray-500 mb-1">Claim Safety</p>
                <p className="text-2xl font-bold text-gray-900">{result.claim_safety}</p>
              </div>
            </div>

            {result.issues && Object.keys(result.issues).length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Issues Found</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  {Object.entries(result.issues).map(([key, issues]: [string, any]) => (
                    <li key={key}>
                      {key}: {Array.isArray(issues) ? issues.join(', ') : issues}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

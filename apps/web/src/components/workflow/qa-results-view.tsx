interface QAResultsViewProps {
  productId: string;
  onRefresh: () => void;
}

export default function QAResultsView(_props: QAResultsViewProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Quality Assurance</h2>

      <div className="space-y-6">
        <div className="flex items-center gap-4 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-4xl">✅</div>
          <div>
            <h3 className="font-semibold text-yellow-900">Automatic Quality Scoring</h3>
            <p className="text-sm text-yellow-800 mt-1">
              Every listing is scored across multiple quality dimensions.
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
            <h3 className="font-semibold text-gray-900 mb-3">QA Process</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li>1. Generate listing</li>
              <li>2. Run QA checks</li>
              <li>3. Get score & issues</li>
              <li>4. Auto-repair if needed</li>
              <li>5. Verify and approve</li>
            </ol>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-800">
            No QA results yet. Generate listings to see quality scores and feedback.
          </p>
        </div>
      </div>
    </div>
  );
}

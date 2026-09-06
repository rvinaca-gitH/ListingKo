interface ExportViewProps {
  productId: string;
  onRefresh: () => void;
}

const EXPORT_FORMATS: Array<{id: string; name: string; description: string; icon: string}> = [
  {
    id: 'pdf',
    name: 'PDF Report',
    description: 'Complete product report with all details',
    icon: '📄',
  },
  {
    id: 'zip',
    name: 'ZIP Package',
    description: 'All files including images and listings',
    icon: '📦',
  },
  {
    id: 'csv',
    name: 'CSV Spreadsheet',
    description: 'Listings data in spreadsheet format',
    icon: '📊',
  },
  {
    id: 'json',
    name: 'JSON Data',
    description: 'Complete data structure for integration',
    icon: '⚙️',
  },
];

export default function ExportView(_props: ExportViewProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Export Package</h2>

      <div className="space-y-6">
        <div className="flex items-center gap-4 p-6 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-4xl">📦</div>
          <div>
            <h3 className="font-semibold text-orange-900">Complete Launch Package</h3>
            <p className="text-sm text-orange-800 mt-1">
              Download your product and listings in your preferred format.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXPORT_FORMATS.map((format) => (
            <button
              key={format.id}
              className="border-2 border-gray-300 rounded-lg p-4 text-left hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer"
              disabled
            >
              <div className="text-3xl mb-2">{format.icon}</div>
              <h3 className="font-semibold text-gray-900">{format.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{format.description}</p>
              <p className="text-xs text-gray-400 mt-3">Coming soon</p>
            </button>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-gray-900 mb-3">What's Included</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span>✓</span> Product Master analysis
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span> Platform-specific listings (Shopee, Lazada, TikTok Shop, Facebook)
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span> Product images
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span> QA scores and recommendations
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span> SEO keywords and optimization tips
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span> SKU and specifications
            </li>
          </ul>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-800">
            <strong>Pro Tip:</strong> Complete all workflow steps (Analysis, Listings, QA) for the most comprehensive
            export package.
          </p>
        </div>
      </div>
    </div>
  );
}

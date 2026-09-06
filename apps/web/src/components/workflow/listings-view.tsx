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

export default function ListingsView(_props: ListingsViewProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Platform Listings</h2>

      <div className="space-y-6">
        <div className="flex items-center gap-4 p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-4xl">🌍</div>
          <div>
            <h3 className="font-semibold text-green-900">Multi-Platform Generation</h3>
            <p className="text-sm text-green-800 mt-1">
              Generate platform-specific listings optimized for each marketplace.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PLATFORMS.map((platform) => (
            <div
              key={platform.id}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition cursor-pointer"
            >
              <div className="text-3xl mb-2">{platform.icon}</div>
              <h3 className="font-medium text-gray-900 text-sm">{platform.name}</h3>
              <p className="text-xs text-gray-500 mt-2">Not generated yet</p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-6 mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Coming Soon</h3>
          <p className="text-sm text-gray-600">
            Once your Product Master is ready, you'll be able to generate platform-specific
            listings optimized for each marketplace with platform-specific tone, keywords, and formatting.
          </p>
        </div>
      </div>
    </div>
  );
}

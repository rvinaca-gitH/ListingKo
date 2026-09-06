interface ImagesViewProps {
  productId: string;
  onRefresh: () => void;
}

export default function ImagesView(_props: ImagesViewProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Product Images</h2>

      <div className="space-y-6">
        <div className="flex items-center gap-4 p-6 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="text-4xl">🖼️</div>
          <div>
            <h3 className="font-semibold text-purple-900">Image Factory</h3>
            <p className="text-sm text-purple-800 mt-1">
              Upload photos or generate AI images for your product.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-3xl mb-3">📤</div>
            <h3 className="font-medium text-gray-900 mb-2">Upload Photos</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your product photos help AI create accurate descriptions
            </p>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition">
              Upload Image
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="font-medium text-gray-900 mb-2">Generate with AI</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create hero, lifestyle, and lifestyle images automatically
            </p>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition">
              Generate Images
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>Tip:</strong> High-quality product photos significantly improve listing effectiveness and
            help our AI understand your product better.
          </p>
        </div>
      </div>
    </div>
  );
}

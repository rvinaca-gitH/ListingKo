'use client';

import { useState, useRef } from 'react';

interface ImagesViewProps {
  productId: string;
  onRefresh: () => void;
}

export default function ImagesView({ productId, onRefresh }: ImagesViewProps) {
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      // Upload logic will be implemented in Phase 4
      console.log('Uploading file:', files[0].name);
      // TODO: Upload to /api/images
      onRefresh();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateImages = async () => {
    try {
      setGenerating(true);
      // Image generation logic will be implemented in Phase 4
      console.log('Generating images for product:', productId);
      // TODO: Call /api/images/generate
      onRefresh();
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

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
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer">
            <div className="text-3xl mb-3">📤</div>
            <h3 className="font-medium text-gray-900 mb-2">Upload Photos</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your product photos help AI create accurate descriptions
            </p>
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="font-medium text-gray-900 mb-2">Generate with AI</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create hero, lifestyle, and lifestyle images automatically
            </p>
            <button
              onClick={handleGenerateImages}
              disabled={generating}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Images'}
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

'use client';

import { useState, useRef, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface ImagesViewProps {
  productId: string;
}

interface Image {
  id: string;
  url_original: string;
  url_medium?: string;
  url_large?: string;
  type: string;
  created_at?: string;
}

export default function ImagesView({ productId }: ImagesViewProps) {
  const [images, setImages] = useState<Image[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadImages();
  }, [productId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const images = await apiClient.getImages(productId);
      setImages(images);
    } catch (err) {
      console.error('Failed to load images:', err);
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setError(null);
      console.log('Uploading image for product:', productId);
      const result = await apiClient.uploadImage(productId, files[0]);
      console.log('Upload successful:', result);
      await loadImages();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      console.error('Upload failed:', err, { productId, fileName: files[0]?.name });
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateImages = async () => {
    try {
      setGenerating(true);
      setError(null);
      console.log('Generating images for product:', productId);
      const result = await apiClient.generateImages(productId);
      console.log('Generation successful:', result);
      await loadImages();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      console.error('Generation failed:', err, { productId });
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      setError(null);
      await apiClient.deleteImage(imageId);
      await loadImages();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      setError(message);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Product Images</h2>

      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

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

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading images...</p>
          </div>
        ) : images.length > 0 ? (
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">
              Your Images ({images.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
                >
                  <img
                    src={image.url_original}
                    alt="Product"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="opacity-0 group-hover:opacity-100 transition bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1">
                    {image.type === 'AI_GENERATED' ? '✨ AI Generated' : '📤 Uploaded'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No images yet. Upload or generate images to get started.</p>
          </div>
        )}

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

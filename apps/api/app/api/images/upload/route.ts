import { NextRequest } from 'next/server';
import { ApiResponse } from '@listingko/shared-types';
import { getAuthUser } from '@/lib/auth';
import { corsResponse } from '@/lib/cors';
import { uploadImage, ImageUploadInput } from '@/lib/images/image-processor';

export const runtime = 'nodejs';

// Handle CORS preflight
export async function OPTIONS() {
  return corsResponse(null, { status: 204 });
}

// POST /api/images/upload - Upload product image
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        } as unknown as ApiResponse,
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;

    if (!file || !productId) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'file and productId are required',
          },
        } as unknown as ApiResponse,
        { status: 400 }
      );
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.type)) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'INVALID_FILE',
            message: 'Only JPEG, PNG, WebP, and GIF images are allowed',
          },
        } as unknown as ApiResponse,
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File must be smaller than 10MB',
          },
        } as unknown as ApiResponse,
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload image
    const uploadInput: ImageUploadInput = {
      productId,
      userId,
      buffer,
      filename: file.name,
      mimeType: file.type,
    };

    const result = await uploadImage(uploadInput);

    return corsResponse(
      {
        success: true,
        data: result,
        error: null,
      } as ApiResponse<any>,
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/images/upload error:', error);
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to upload image',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

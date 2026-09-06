import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Image } from '@listingko/shared-types';
import Database from '@/lib/database';
import { getAuthUser } from '@/lib/auth';

export const runtime = 'nodejs';

// GET /api/images
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json(
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

    const productId = request.nextUrl.searchParams.get('productId') || undefined;
    const type = request.nextUrl.searchParams.get('type') || undefined;

    const images = await Database.listImages(userId, {
      productId: productId || undefined,
      type: type as any || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: images,
        total: images.length,
      },
      error: null,
    } as ApiResponse);
  } catch (error) {
    console.error('GET /api/images error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list images',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

// POST /api/images (Upload or create)
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json(
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

    const body = await request.json() as {
      productId: string;
      type: 'USER_UPLOAD' | 'AI_GENERATED' | 'AI_EDITED';
      urlOriginal: string;
      width: number;
      height: number;
      originalFilename?: string;
      sizeBytes?: number;
      mimeType?: string;
      purposes?: string[];
    };

    // Validation
    if (!body.productId) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'productId is required',
          },
        } as unknown as ApiResponse,
        { status: 400 }
      );
    }

    if (!body.urlOriginal || !body.width || !body.height) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'urlOriginal, width, and height are required',
          },
        } as unknown as ApiResponse,
        { status: 400 }
      );
    }

    // Check product exists
    const product = await Database.getProduct(body.productId, userId);
    if (!product) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        } as unknown as ApiResponse,
        { status: 404 }
      );
    }

    const image = await Database.createImage({
      product_id: body.productId,
      user_id: userId,
      url_original: body.urlOriginal,
      type: body.type,
      width: body.width,
      height: body.height,
      original_filename: body.originalFilename,
      size_bytes: body.sizeBytes,
      mime_type: body.mimeType,
      purposes: body.purposes,
    });

    return NextResponse.json(
      {
        success: true,
        data: image,
        error: null,
      } as ApiResponse<Image>,
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/images error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create image',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

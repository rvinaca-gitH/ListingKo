import { NextRequest } from 'next/server';
import { ApiResponse } from '@listingko/shared-types';
import { Database, supabase } from '@/lib/database';
import { getAuthUser } from '@/lib/auth';
import { corsResponse } from '@/lib/cors';
import { generateImageVariations } from '@/lib/images/ai-generator';

export const runtime = 'nodejs';

// Handle CORS preflight
export async function OPTIONS() {
  return corsResponse(null, { status: 204 });
}

// POST /api/images/generate - Generate AI product images
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

    const body = await request.json() as {
      productId: string;
    };

    if (!body.productId) {
      return corsResponse(
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

    // Get product details
    const product = await Database.getProduct(body.productId, userId);
    if (!product) {
      return corsResponse(
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

    // Get product master for more details
    const productMaster = await supabase
      .from('product_masters')
      .select('*')
      .eq('product_id', body.productId)
      .single();

    const productName = productMaster.data?.name || product.title || 'Product';
    const productDescription = productMaster.data?.description || product.description || '';

    // Generate image variations
    const generatedImages = await generateImageVariations(
      body.productId,
      userId,
      productName,
      productDescription
    );

    return corsResponse(
      {
        success: true,
        data: {
          images: generatedImages,
          count: generatedImages.length,
          message: `Generated ${generatedImages.length} product images`,
        },
        error: null,
      } as ApiResponse<any>,
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/images/generate error:', error);
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate images',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

import { NextRequest } from 'next/server';
import { ApiResponse, CreateProductInput, Product } from '@listingko/shared-types';
import { getAuthUser } from '@/lib/auth';
import { corsResponse } from '@/lib/cors';

export const runtime = 'nodejs';

// Handle CORS preflight
export async function OPTIONS() {
  return corsResponse(null, { status: 204 });
}

// GET /api/products
export async function GET(request: NextRequest) {
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

    // MOCK: Return empty list for testing
    return corsResponse({
      success: true,
      data: {
        items: [],
        total: 0,
        hasMore: false,
      },
      error: null,
    } as ApiResponse);
  } catch (error) {
    console.error('GET /api/products error:', error);
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list products',
        },
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// POST /api/products
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

    const body = (await request.json()) as CreateProductInput;

    // Validation
    if (!body.title || body.title.trim().length === 0) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Title is required',
            details: { field: 'title' },
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // MOCK: Return mock product for testing (no database)
    const mockProduct: Product = {
      id: 'prod-' + Date.now(),
      user_id: userId,
      title: body.title.trim(),
      description: body.description?.trim() || '',
      category: body.category?.trim() || '',
      status: 'DRAFT',
      free_tier_used: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return corsResponse(
      {
        success: true,
        data: mockProduct,
        error: null,
      } as ApiResponse<Product>,
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/products error:', error);
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create product',
        },
      } as ApiResponse,
      { status: 500 }
    );
  }
}

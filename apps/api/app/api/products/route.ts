import { NextRequest } from 'next/server';
import { ApiResponse, CreateProductInput, Product, PaginatedResponse } from '@listingko/shared-types';
import { getAuthUser } from '@/lib/auth';
import { corsResponse } from '@/lib/cors';
import { Database } from '@/lib/database';

export const runtime = 'nodejs';

// Handle CORS preflight
export async function OPTIONS() {
  return corsResponse(null, { status: 204 });
}

// GET /api/products - List user's products
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
        } as ApiResponse,
        { status: 401 }
      );
    }

    // Get pagination params
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Fetch from database
    const { data: products, total } = await Database.listProducts(userId, limit, offset);

    return corsResponse({
      success: true,
      data: {
        items: products,
        total,
        hasMore: offset + limit < total,
      } as PaginatedResponse<Product>,
      error: null,
    } as ApiResponse<PaginatedResponse<Product>>);
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

// POST /api/products - Create new product
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
        } as ApiResponse,
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

    // Create product in database
    const product = await Database.createProduct({
      user_id: userId,
      title: body.title.trim(),
      description: body.description?.trim() || '',
      category: body.category?.trim() || '',
      status: 'DRAFT',
      free_tier_used: false,
    });

    return corsResponse(
      {
        success: true,
        data: product,
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

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, CreateProductInput, Product } from '@listingko/shared-types';
import Database from '@/lib/database';
import { getAuthUser } from '@/lib/auth';

export const runtime = 'nodejs';

// GET /api/products
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

    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 50), 100);
    const offset = Number(request.nextUrl.searchParams.get('offset') || 0);

    const { data, total } = await Database.listProducts(userId, limit, offset);

    return NextResponse.json({
      success: true,
      data: {
        items: data,
        total,
        hasMore: offset + limit < total,
      },
      error: null,
    } as ApiResponse);
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json(
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

    const body = (await request.json()) as CreateProductInput;

    // Validation
    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json(
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

    const product = await Database.createProduct({
      user_id: userId,
      title: body.title.trim(),
      description: body.description?.trim(),
      category: body.category?.trim(),
      status: 'DRAFT',
      free_tier_used: false,
    });

    return NextResponse.json(
      {
        success: true,
        data: product,
        error: null,
      } as ApiResponse<Product>,
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/products error:', error);
    return NextResponse.json(
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

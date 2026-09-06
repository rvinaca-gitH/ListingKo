import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Product, UpdateProductInput } from '@listingko/shared-types';
import Database from '@/lib/database';
import { getAuthUser } from '@/lib/auth';

export const runtime = 'nodejs';

// GET /api/products/:id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const product = await Database.getProduct(params.id, userId);
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

    // Fetch related data
    const productMaster = await Database.getProductMaster(params.id, userId);
    const listings = await Database.listListings(userId, { productId: params.id });
    const images = await Database.listImages(userId, { productId: params.id });

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        productMaster,
        listings,
        images,
      },
      error: null,
    } as ApiResponse);
  } catch (error) {
    console.error('GET /api/products/:id error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch product',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

// PUT /api/products/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const product = await Database.getProduct(params.id, userId);
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

    const body = (await request.json()) as UpdateProductInput;

    const updated = await Database.updateProduct(params.id, userId, {
      title: body.title?.trim(),
      description: body.description?.trim(),
      category: body.category?.trim(),
    });

    return NextResponse.json({
      success: true,
      data: updated,
      error: null,
    } as ApiResponse<Product>);
  } catch (error) {
    console.error('PUT /api/products/:id error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update product',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

// DELETE /api/products/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const product = await Database.getProduct(params.id, userId);
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

    await Database.softDeleteProduct(params.id, userId);

    return NextResponse.json({
      success: true,
      data: { id: params.id },
      error: null,
    } as ApiResponse);
  } catch (error) {
    console.error('DELETE /api/products/:id error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete product',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

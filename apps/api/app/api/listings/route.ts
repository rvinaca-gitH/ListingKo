import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Listing, GenerateListingInput } from '@listingko/shared-types';
import Database from '@/lib/database';
import { getAuthUser } from '@/lib/auth';

export const runtime = 'nodejs';

// GET /api/listings
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
    const platform = request.nextUrl.searchParams.get('platform') || undefined;
    const status = request.nextUrl.searchParams.get('status') || undefined;

    const listings = await Database.listListings(userId, {
      productId: productId || undefined,
      platform: platform || undefined,
      status: status || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: listings,
        total: listings.length,
      },
      error: null,
    } as ApiResponse);
  } catch (error) {
    console.error('GET /api/listings error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list listings',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

// POST /api/listings (Generate)
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

    const body = (await request.json()) as GenerateListingInput;

    // Validation
    if (!body.productId) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'productId is required',
            details: { field: 'productId' },
          },
        } as unknown as ApiResponse,
        { status: 400 }
      );
    }

    if (!body.platforms || body.platforms.length === 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'platforms array is required',
            details: { field: 'platforms' },
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

    // Check product master exists
    const productMaster = await Database.getProductMaster(body.productId, userId);
    if (!productMaster) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Product analysis required before generating listings',
            details: { requiresAnalysis: true },
          },
        } as unknown as ApiResponse,
        { status: 400 }
      );
    }

    // Create listings for each platform
    const createdListings: Listing[] = [];
    for (const platform of body.platforms) {
      const listing = await Database.createListing({
        product_id: body.productId,
        product_master_id: productMaster.id,
        user_id: userId,
        platform: platform,
        title: `${productMaster.name} - ${platform}`,
        description: productMaster.description,
        status: 'DRAFT',
        qa_passed: false,
      });
      createdListings.push(listing);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          items: createdListings,
          total: createdListings.length,
        },
        error: null,
      } as ApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/listings error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate listings',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, Listing, UpdateListingInput } from '@listingko/shared-types';
import Database from '@/lib/database';
import { getAuthUser } from '@/lib/auth';

export const runtime = 'nodejs';

// GET /api/listings/:id
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

    const listing = await Database.getListing(params.id, userId);
    if (!listing) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Listing not found',
          },
        } as unknown as ApiResponse,
        { status: 404 }
      );
    }

    // Fetch QA result if exists
    let qaResult = null;
    if (listing.qa_result_id) {
      qaResult = await Database.getQAResult(listing.qa_result_id);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...listing,
        qaResult,
      },
      error: null,
    } as ApiResponse);
  } catch (error) {
    console.error('GET /api/listings/:id error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch listing',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

// PUT /api/listings/:id
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

    const listing = await Database.getListing(params.id, userId);
    if (!listing) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Listing not found',
          },
        } as unknown as ApiResponse,
        { status: 404 }
      );
    }

    const body = (await request.json()) as UpdateListingInput;

    const updated = await Database.updateListing(params.id, {
      title: body.title?.trim(),
      description: body.description?.trim(),
      platform_data: body.platformData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      error: null,
    } as ApiResponse<Listing>);
  } catch (error) {
    console.error('PUT /api/listings/:id error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update listing',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

// DELETE /api/listings/:id
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

    const listing = await Database.getListing(params.id, userId);
    if (!listing) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Listing not found',
          },
        } as unknown as ApiResponse,
        { status: 404 }
      );
    }

    await Database.softDeleteListing(params.id);

    return NextResponse.json({
      success: true,
      data: { id: params.id },
      error: null,
    } as ApiResponse);
  } catch (error) {
    console.error('DELETE /api/listings/:id error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete listing',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

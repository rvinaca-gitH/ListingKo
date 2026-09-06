import { NextRequest } from 'next/server';
import { ApiResponse } from '@listingko/shared-types';
import { Database, supabase } from '@/lib/database';
import { getAuthUser } from '@/lib/auth';
import { corsResponse } from '@/lib/cors';
import { MarketplaceAdapterFactory, MarketplaceCredentials } from '@/lib/marketplaces';

export const runtime = 'nodejs';

// Handle CORS preflight
export async function OPTIONS() {
  return corsResponse(null, { status: 204 });
}

// POST /api/listings/[id]/publish
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
      marketplaceConnectionId: string;
    };

    // Validate listing exists and belongs to user
    const listing = await Database.getListing(params.id, userId);
    if (!listing) {
      return corsResponse(
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

    // Validate listing passed QA
    if (!listing.qa_passed) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Listing must pass QA before publishing',
          },
        } as unknown as ApiResponse,
        { status: 400 }
      );
    }

    // Get marketplace connection
    const connection = await supabase
      .from('marketplace_connections')
      .select('*')
      .eq('id', body.marketplaceConnectionId)
      .eq('user_id', userId)
      .single();

    if (connection.error || !connection.data) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Marketplace connection not found',
          },
        } as unknown as ApiResponse,
        { status: 404 }
      );
    }

    // Validate connection status
    if (connection.data.status !== 'CONNECTED') {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'INVALID_STATE',
            message: `Marketplace connection is ${connection.data.status}`,
          },
        } as unknown as ApiResponse,
        { status: 400 }
      );
    }

    // Get marketplace-specific adapter
    const marketplaceCredentials: MarketplaceCredentials = {
      accessToken: connection.data.oauth_token || '',
      refreshToken: connection.data.oauth_refresh_token,
      expiresAt: connection.data.oauth_expires_at ? new Date(connection.data.oauth_expires_at) : undefined,
      shopId: connection.data.shop_id || '',
      shopName: connection.data.shop_name || '',
    };

    const adapter = MarketplaceAdapterFactory.createAdapter(
      listing.platform,
      marketplaceCredentials
    );

    // Validate listing with marketplace-specific rules
    const validation = await adapter.validateListing(listing);
    if (!validation.valid) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Listing validation failed: ${validation.errors?.join(', ')}`,
          },
        } as unknown as ApiResponse,
        { status: 400 }
      );
    }

    // Publish to marketplace
    const publishResult = await adapter.publishListing(listing);
    if (!publishResult.success) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'PUBLISH_ERROR',
            message: publishResult.error,
          },
        } as unknown as ApiResponse,
        { status: 400 }
      );
    }

    // Update listing with published info
    const updateResult = await supabase
      .from('listings')
      .update({
        status: 'PUBLISHED',
        published_at: new Date().toISOString(),
        platform_listing_id: publishResult.platformListingId,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateResult.error) {
      throw updateResult.error;
    }

    return corsResponse(
      {
        success: true,
        data: {
          listing: updateResult.data,
          platformListingId: publishResult.platformListingId,
          message: `Successfully published to ${listing.platform}`,
          details: publishResult.details,
        },
        error: null,
      } as ApiResponse<any>,
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/listings/[id]/publish error:', error);
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to publish listing',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

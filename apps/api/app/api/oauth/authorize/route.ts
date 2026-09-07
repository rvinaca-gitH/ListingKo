import { NextRequest } from 'next/server';
import { ApiResponse } from '@listingko/shared-types';
import { supabase } from '@/lib/database';
import { getAuthUser } from '@/lib/auth';
import { corsResponse } from '@/lib/cors';
import { MarketplaceAdapterFactory, MarketplaceCredentials } from '@/lib/marketplaces';
import { randomBytes } from 'crypto';
import { SUPPORTED_MARKETPLACES } from '@/lib/marketplaces/supported';

export const runtime = 'nodejs';

// Handle CORS preflight
export async function OPTIONS() {
  return corsResponse(null, { status: 204 });
}

// POST /api/oauth/authorize - Get OAuth authorization URL for a marketplace
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
      marketplace: string;
    };

    if (!SUPPORTED_MARKETPLACES.includes(body.marketplace as (typeof SUPPORTED_MARKETPLACES)[number])) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'marketplace is required',
          },
        } as unknown as ApiResponse,
        { status: 400 }
      );
    }

    // Generate state for CSRF protection
    const state = randomBytes(32).toString('hex');

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const stateRecord = await supabase
      .from('oauth_states')
      .insert({ state, user_id: userId, marketplace: body.marketplace, expires_at: expiresAt });

    if (stateRecord.error) {
      throw stateRecord.error;
    }

    // Create adapter to get authorization URL
    const mockCredentials: MarketplaceCredentials = {
      accessToken: '',
      shopId: '',
      shopName: '',
    };

    const adapter = MarketplaceAdapterFactory.createAdapter(
      body.marketplace,
      mockCredentials
    );

    const authorizationUrl = adapter.getAuthorizationUrl(state);

    return corsResponse(
      {
        success: true,
        data: {
          authorizationUrl,
          marketplace: body.marketplace,
          state,
        },
        error: null,
      } as ApiResponse<any>,
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/oauth/authorize error:', error);
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate authorization URL',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

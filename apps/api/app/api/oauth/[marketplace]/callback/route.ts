import { NextRequest } from 'next/server';
import { ApiResponse } from '@listingko/shared-types';
import { supabase } from '@/lib/database';
import { getAuthUser } from '@/lib/auth';
import { corsResponse } from '@/lib/cors';
import { MarketplaceAdapterFactory, MarketplaceCredentials } from '@/lib/marketplaces';

export const runtime = 'nodejs';

// Handle OAuth callback from marketplace
export async function GET(request: NextRequest, { params }: { params: { marketplace: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'OAUTH_ERROR',
            message: `OAuth failed: ${error}`,
          },
        } as unknown as ApiResponse,
        { status: 400 }
      );
    }

    if (!code || !state) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing code or state parameter',
          },
        } as unknown as ApiResponse,
        { status: 400 }
      );
    }

    // TODO: Verify state to prevent CSRF attacks
    // For now, we'll accept any state

    // Get user from state (would be encoded in real implementation)
    const userId = '00000000-0000-0000-0000-000000000001'; // Dev mode user

    // Create adapter for marketplace
    const mockCredentials: MarketplaceCredentials = {
      accessToken: `${params.marketplace}_token_${Date.now()}`,
      shopId: 'temp_shop_id',
      shopName: 'Connected Shop',
    };

    const adapter = MarketplaceAdapterFactory.createAdapter(params.marketplace, mockCredentials);

    // Exchange code for token with marketplace
    const credentials = await adapter.exchangeCodeForToken(code);

    // Validate credentials by checking with marketplace
    const isValid = await adapter.validateCredentials();
    if (!isValid) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Failed to validate marketplace credentials',
          },
        } as unknown as ApiResponse,
        { status: 400 }
      );
    }

    // Get shop info
    const shopInfo = await adapter.getShopInfo();

    // Update or create marketplace connection in database
    const connection = await supabase
      .from('marketplace_connections')
      .upsert(
        {
          user_id: userId,
          marketplace: params.marketplace,
          oauth_token: credentials.accessToken,
          oauth_refresh_token: credentials.refreshToken,
          oauth_expires_at: credentials.expiresAt?.toISOString(),
          status: 'CONNECTED',
          shop_id: credentials.shopId,
          shop_name: credentials.shopName,
          credentials_encrypted: JSON.stringify(credentials),
          credentials_iv: 'placeholder_iv',
        },
        { onConflict: 'user_id,marketplace' }
      )
      .select()
      .single();

    if (connection.error) {
      throw connection.error;
    }

    // Redirect to success page or dashboard
    // In real implementation, would redirect to frontend with success message
    return corsResponse(
      {
        success: true,
        data: {
          marketplace: params.marketplace,
          shopId: credentials.shopId,
          shopName: credentials.shopName,
          message: `Successfully connected ${params.marketplace}`,
        },
        error: null,
      } as ApiResponse<any>,
      { status: 200 }
    );
  } catch (error) {
    console.error(`GET /api/oauth/${params.marketplace}/callback error:`, error);
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'OAuth callback processing failed',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

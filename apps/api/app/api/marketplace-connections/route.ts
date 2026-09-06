import { NextRequest } from 'next/server';
import { ApiResponse } from '@listingko/shared-types';
import { Database } from '@/lib/database';
import { getAuthUser } from '@/lib/auth';
import { corsResponse } from '@/lib/cors';

export const runtime = 'nodejs';

// Handle CORS preflight
export async function OPTIONS() {
  return corsResponse(null, { status: 204 });
}

// GET /api/marketplace-connections (List user's marketplace connections)
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

    const connections = await Database.supabase
      .from('marketplace_connections')
      .select('id, marketplace, status, shop_id, shop_name, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (connections.error) {
      throw connections.error;
    }

    return corsResponse(
      {
        success: true,
        data: connections.data || [],
        error: null,
      } as ApiResponse<any[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/marketplace-connections error:', error);
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch marketplace connections',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

// POST /api/marketplace-connections (Create new connection)
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
      credentials?: {
        apiKey?: string;
        apiSecret?: string;
        shopId?: string;
        accessToken?: string;
      };
      shopId?: string;
      shopName?: string;
    };

    // Validation
    if (!body.marketplace || !['shopee', 'lazada', 'tiktok', 'facebook'].includes(body.marketplace)) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid marketplace',
          },
        } as unknown as ApiResponse,
        { status: 400 }
      );
    }

    // Check if connection already exists
    const existing = await Database.supabase
      .from('marketplace_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('marketplace', body.marketplace)
      .single();

    if (!existing.error && existing.data) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'ALREADY_EXISTS',
            message: `${body.marketplace} connection already exists`,
          },
        } as unknown as ApiResponse,
        { status: 409 }
      );
    }

    // TODO: Encrypt credentials before storing
    // For now, use placeholder encryption (in production, use actual encryption)
    const credentialsEncrypted = JSON.stringify(body.credentials || {});
    const credentialsIv = 'placeholder-iv'; // TODO: Generate proper IV

    const result = await Database.supabase
      .from('marketplace_connections')
      .insert({
        user_id: userId,
        marketplace: body.marketplace,
        credentials_encrypted: credentialsEncrypted,
        credentials_iv: credentialsIv,
        status: 'CONNECTED',
        shop_id: body.shopId,
        shop_name: body.shopName,
      })
      .select()
      .single();

    if (result.error) {
      throw result.error;
    }

    return corsResponse(
      {
        success: true,
        data: result.data,
        error: null,
      } as ApiResponse<any>,
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/marketplace-connections error:', error);
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create marketplace connection',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

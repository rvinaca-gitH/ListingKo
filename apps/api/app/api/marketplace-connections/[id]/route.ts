import { NextRequest } from 'next/server';
import { ApiResponse } from '@listingko/shared-types';
import { supabase } from '@/lib/database';
import { getAuthUser } from '@/lib/auth';
import { corsResponse } from '@/lib/cors';

export const runtime = 'nodejs';

// Handle CORS preflight
export async function OPTIONS() {
  return corsResponse(null, { status: 204 });
}

// GET /api/marketplace-connections/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const connection = await supabase
      .from('marketplace_connections')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single();

    if (connection.error) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Connection not found',
          },
        } as unknown as ApiResponse,
        { status: 404 }
      );
    }

    return corsResponse(
      {
        success: true,
        data: connection.data,
        error: null,
      } as ApiResponse<any>,
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/marketplace-connections/[id] error:', error);
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch connection',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

// DELETE /api/marketplace-connections/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const result = await supabase
      .from('marketplace_connections')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId);

    if (result.error) {
      throw result.error;
    }

    return corsResponse(
      {
        success: true,
        data: null,
        error: null,
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/marketplace-connections/[id] error:', error);
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete connection',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

// PUT /api/marketplace-connections/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
      status?: string;
      shop_id?: string;
      shop_name?: string;
    };

    const result = await supabase
      .from('marketplace_connections')
      .update({
        status: body.status,
        shop_id: body.shop_id,
        shop_name: body.shop_name,
      })
      .eq('id', params.id)
      .eq('user_id', userId)
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
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/marketplace-connections/[id] error:', error);
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update connection',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

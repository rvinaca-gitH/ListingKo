import { NextRequest } from 'next/server';
import { ApiResponse } from '@listingko/shared-types';
import { supabase } from '@/lib/database';
import { getAuthUser } from '@/lib/auth';
import { corsResponse } from '@/lib/cors';
import { deleteImage } from '@/lib/images/image-processor';

export const runtime = 'nodejs';

// Handle CORS preflight
export async function OPTIONS() {
  return corsResponse(null, { status: 204 });
}

// GET /api/images/[id] - Get single image
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

    const image = await supabase
      .from('images')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', userId)
      .single();

    if (image.error || !image.data) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Image not found',
          },
        } as unknown as ApiResponse,
        { status: 404 }
      );
    }

    return corsResponse(
      {
        success: true,
        data: image.data,
        error: null,
      } as ApiResponse<any>,
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/images/[id] error:', error);
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch image',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

// DELETE /api/images/[id] - Delete image
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

    await deleteImage(params.id, userId);

    return corsResponse(
      {
        success: true,
        data: null,
        error: null,
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/images/[id] error:', error);
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete image',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

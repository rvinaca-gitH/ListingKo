import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@listingko/shared-types';
import Database from '@/lib/database';
import { getAuthUser } from '@/lib/auth';

export const runtime = 'nodejs';

// DELETE /api/images/:id
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

    // Check if image belongs to user (by fetching all user images and checking)
    const allImages = await Database.listImages(userId);
    const image = allImages.find((img) => img.id === params.id);

    if (!image) {
      return NextResponse.json(
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

    await Database.softDeleteImage(params.id);

    return NextResponse.json({
      success: true,
      data: { id: params.id },
      error: null,
    } as ApiResponse);
  } catch (error) {
    console.error('DELETE /api/images/:id error:', error);
    return NextResponse.json(
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

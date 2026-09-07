import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@listingko/shared-types';
import Database from '@/lib/database';
import { getAuthUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/subscription
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

    const subscription = await Database.getSubscription(userId);
    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Subscription not found',
          },
        } as unknown as ApiResponse,
        { status: 404 }
      );
    }

    const entitlements = await Database.getEntitlements(userId);

    return NextResponse.json({
      success: true,
      data: {
        ...subscription,
        entitlements,
      },
      error: null,
    } as ApiResponse);
  } catch (error) {
    console.error('GET /api/subscription error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch subscription',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

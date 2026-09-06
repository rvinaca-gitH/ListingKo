import { NextRequest } from 'next/server';
import { ApiResponse, QAResult } from '@listingko/shared-types';
import { Database, supabase } from '@/lib/database';
import { getAuthUser } from '@/lib/auth';
import { corsResponse } from '@/lib/cors';

export const runtime = 'nodejs';

// Handle CORS preflight
export async function OPTIONS() {
  return corsResponse(null, { status: 204 });
}

// GET /api/qa-results?productId=... (Get QA results for product's listings)
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

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'productId is required',
          },
        } as unknown as ApiResponse,
        { status: 400 }
      );
    }

    // Fetch all QA results for listings belonging to this product
    const results = await supabase
      .from('qa_results')
      .select(`
        *,
        listing:listings(id, platform, status)
      `)
      .eq('user_id', userId)
      .eq('listings.product_id', productId)
      .order('created_at', { ascending: false });

    if (results.error) {
      throw results.error;
    }

    return corsResponse(
      {
        success: true,
        data: results.data || [],
        error: null,
      } as ApiResponse<QAResult[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/qa-results error:', error);
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch QA results',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

// POST /api/qa-results (Score a listing)
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
      listingId: string;
      factAccuracy: number;
      seoQuality: number;
      platformFit: number;
      readability: number;
      claimSafety: number;
      issues?: Record<string, string[]>;
    };

    // Validation
    if (!body.listingId) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'listingId is required',
          },
        } as unknown as ApiResponse,
        { status: 400 }
      );
    }

    // Check listing exists and belongs to user
    const listing = await Database.getListing(body.listingId, userId);
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

    // Calculate total score (average of all scores)
    const totalScore = Math.round(
      (body.factAccuracy +
        body.seoQuality +
        body.platformFit +
        body.readability +
        body.claimSafety) /
        5
    );

    // Determine if passed (>= 85)
    const passed = totalScore >= 85;

    const qaResult = await Database.createQAResult({
      listing_id: body.listingId,
      user_id: userId,
      fact_accuracy: body.factAccuracy,
      seo_quality: body.seoQuality,
      platform_fit: body.platformFit,
      readability: body.readability,
      claim_safety: body.claimSafety,
      total_score: totalScore,
      passed,
      issues: body.issues,
      attempted_repair: false,
    });

    // Update listing with QA result
    await Database.updateListing(body.listingId, {
      qa_result_id: qaResult.id,
      qa_passed: passed,
      qa_score: totalScore,
      status: passed ? 'QA_PASSED' : 'QA_FAILED',
    });

    return corsResponse(
      {
        success: true,
        data: qaResult,
        error: null,
      } as ApiResponse<QAResult>,
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/qa-results error:', error);
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create QA result',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

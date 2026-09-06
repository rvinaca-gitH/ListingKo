import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, QAResult } from '@listingko/shared-types';
import Database from '@/lib/database';
import { getAuthUser } from '@/lib/auth';

export const runtime = 'nodejs';

// POST /api/qa-results (Score a listing)
export async function POST(request: NextRequest) {
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
      return NextResponse.json(
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

    return NextResponse.json(
      {
        success: true,
        data: qaResult,
        error: null,
      } as ApiResponse<QAResult>,
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/qa-results error:', error);
    return NextResponse.json(
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

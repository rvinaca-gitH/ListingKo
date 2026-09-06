import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@listingko/shared-types';
import Database from '@/lib/database';
import { getAuthUser } from '@/lib/auth';
import { generateListing as generateListingAI, scoreListingQA } from '@/lib/ai';

export const runtime = 'nodejs';

// POST /api/listings/generate
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

    const body = (await request.json()) as {
      listingId: string;
      platforms?: string[];
    };

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

    // Get listing
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

    // Get product master
    const productMaster = await Database.getProductMaster(listing.product_id, userId);
    if (!productMaster) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Product analysis required before generating listing content',
          },
        } as unknown as ApiResponse,
        { status: 400 }
      );
    }

    // Generate listing content using AI
    const generatedContent = await generateListingAI(productMaster, listing.platform);

    // Update listing with generated content
    await Database.updateListing(body.listingId, {
      title: generatedContent.title,
      description: generatedContent.description,
      platform_data: generatedContent.platformData,
      ai_version: 'claude-opus-4-1-20250805',
      generated_at: new Date().toISOString(),
      status: 'QA_PENDING',
    });

    // Run QA scoring
    const qaScore = await scoreListingQA(
      { title: generatedContent.title, description: generatedContent.description },
      productMaster,
      listing.platform
    );

    // Create QA result
    const qaResult = await Database.createQAResult({
      listing_id: body.listingId,
      user_id: userId,
      fact_accuracy: qaScore.factAccuracy,
      seo_quality: qaScore.seoQuality,
      platform_fit: qaScore.platformFit,
      readability: qaScore.readability,
      claim_safety: qaScore.claimSafety,
      total_score:
        Math.round(
          (qaScore.factAccuracy +
            qaScore.seoQuality +
            qaScore.platformFit +
            qaScore.readability +
            qaScore.claimSafety) /
            5
        ) || 0,
      passed: false, // Will be set based on total_score
      issues: qaScore.issues,
      attempted_repair: false,
    });

    // Update listing with QA result and status
    const finalListing = await Database.updateListing(body.listingId, {
      qa_result_id: qaResult.id,
      qa_passed: qaResult.passed,
      qa_score: qaResult.total_score,
      status: qaResult.passed ? 'QA_PASSED' : 'QA_FAILED',
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...finalListing,
          qaResult,
        },
        error: null,
      } as ApiResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/listings/generate error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: error instanceof Error && error.message.includes('Claude') ? 'AI_ERROR' : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate listing',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

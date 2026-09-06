import { NextRequest } from 'next/server';
import { ApiResponse, GenerateListingInput } from '@listingko/shared-types';
import { Database } from '@/lib/database';
import { getAuthUser } from '@/lib/auth';
import { corsResponse } from '@/lib/cors';
import { generateListing as generateListingAI, scoreListingQA } from '@/lib/ai';

export const runtime = 'nodejs';

// Handle CORS preflight
export async function OPTIONS() {
  return corsResponse(null, { status: 204 });
}

// POST /api/listings/generate - Generate listings for all platforms
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
        } as ApiResponse,
        { status: 401 }
      );
    }

    const body = (await request.json()) as GenerateListingInput;

    if (!body.productId) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Product ID is required',
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (!body.platforms || body.platforms.length === 0) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one platform is required',
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Get product
    const product = await Database.getProduct(body.productId, userId);
    if (!product) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Get product master
    const productMaster = await Database.getProductMaster(body.productId, userId);
    if (!productMaster) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'INVALID_STATE',
            message: 'Product must be analyzed first (Product Master required)',
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Generate listings for each platform
    const results: any[] = [];
    const errors: string[] = [];

    for (const platform of body.platforms) {
      try {
        console.log(`Generating ${platform} listing for product ${body.productId}`);

        // Generate listing content
        const generatedContent = await generateListingAI(
          productMaster,
          platform as 'shopee' | 'lazada' | 'tiktok' | 'facebook'
        );

        // Create listing
        const listing = await Database.createListing({
          product_id: body.productId,
          product_master_id: productMaster.id,
          user_id: userId,
          platform: platform as 'shopee' | 'lazada' | 'tiktok' | 'facebook',
          title: generatedContent.title,
          description: generatedContent.description,
          platform_data: generatedContent.platformData,
          ai_version: 'v1',
          status: 'QA_PENDING',
          qa_passed: false,
        });

        // Run QA scoring
        const qaScore = await scoreListingQA(
          { title: generatedContent.title, description: generatedContent.description },
          productMaster,
          platform
        );

        // Create QA result
        const totalScore = Math.round(
          (qaScore.factAccuracy + qaScore.seoQuality + qaScore.platformFit + qaScore.readability + qaScore.claimSafety) / 5
        );
        const passed = totalScore >= 85;

        const qaResult = await Database.createQAResult({
          listing_id: listing.id,
          user_id: userId,
          fact_accuracy: qaScore.factAccuracy,
          seo_quality: qaScore.seoQuality,
          platform_fit: qaScore.platformFit,
          readability: qaScore.readability,
          claim_safety: qaScore.claimSafety,
          total_score: totalScore,
          passed,
          issues: qaScore.issues,
          attempted_repair: false,
        });

        // Update listing with QA result
        const finalListing = await Database.updateListing(listing.id, {
          qa_result_id: qaResult.id,
          qa_passed: passed,
          qa_score: totalScore,
          status: passed ? 'QA_PASSED' : 'QA_FAILED',
        });

        results.push({
          platform,
          listing: finalListing,
          qaResult,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${platform}: ${msg}`);
        console.error(`Failed to generate ${platform} listing:`, error);
      }
    }

    if (results.length === 0 && errors.length > 0) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'GENERATION_FAILED',
            message: 'Failed to generate any listings',
            details: { errors },
          },
        } as ApiResponse,
        { status: 500 }
      );
    }

    return corsResponse(
      {
        success: true,
        data: {
          results,
          errors: errors.length > 0 ? errors : undefined,
        },
        error: null,
      } as any,
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/listings/generate error:', error);
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: error instanceof Error && error.message.includes('Claude') ? 'AI_ERROR' : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate listings',
        },
      } as ApiResponse,
      { status: 500 }
    );
  }
}

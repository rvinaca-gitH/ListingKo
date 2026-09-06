import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, ProductMaster } from '@listingko/shared-types';
import Database from '@/lib/database';
import { getAuthUser } from '@/lib/auth';
import { analyzeProduct } from '@/lib/ai';

export const runtime = 'nodejs';

// POST /api/products/:id/analyze
export async function POST(
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

    const product = await Database.getProduct(params.id, userId);
    if (!product) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        } as unknown as ApiResponse,
        { status: 404 }
      );
    }

    // Check if already analyzed
    const existing = await Database.getProductMaster(params.id, userId);
    if (existing) {
      return NextResponse.json(
        {
          success: true,
          data: existing,
          error: null,
        } as ApiResponse<ProductMaster>
      );
    }

    // Update product status to ANALYZING
    await Database.updateProduct(params.id, userId, {
      status: 'ANALYZING',
    });

    try {
      // Call AI to analyze product
      const masterData = await analyzeProduct(
        product.title,
        product.description || '',
        product.category
      );

      // Create product master
      const productMaster = await Database.createProductMaster({
        product_id: params.id,
        user_id: userId,
        name: masterData.name || product.title,
        description: masterData.description || product.description || '',
        category: masterData.category || product.category || 'General',
        sku: masterData.sku || 'SKU-001',
        strengths: masterData.strengths || [],
        target_customer: masterData.target_customer || 'General',
        use_cases: masterData.use_cases || [],
        keywords: masterData.keywords || [],
        seo_score: masterData.seo_score || 75,
        specifications: masterData.specifications || {},
        unsupported_claims: masterData.unsupported_claims || [],
        confidence_score: (masterData.confidence_score || 0.85) as any,
      } as any);

      // Update product status to READY
      await Database.updateProduct(params.id, userId, {
        status: 'READY',
      });

      return NextResponse.json(
        {
          success: true,
          data: productMaster,
          error: null,
        } as ApiResponse<ProductMaster>,
        { status: 201 }
      );
    } catch (aiError) {
      // Update product status back to DRAFT on error
      await Database.updateProduct(params.id, userId, {
        status: 'DRAFT',
      });

      throw aiError;
    }
  } catch (error) {
    console.error('POST /api/products/:id/analyze error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: error instanceof Error && error.message.includes('Claude') ? 'AI_ERROR' : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to analyze product',
        },
      } as unknown as ApiResponse,
      { status: 500 }
    );
  }
}

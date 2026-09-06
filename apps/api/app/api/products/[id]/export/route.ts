import { NextRequest } from 'next/server';
import { ApiResponse, CreateExportInput } from '@listingko/shared-types';
import { Database, supabase } from '@/lib/database';
import { getAuthUser } from '@/lib/auth';
import { corsResponse } from '@/lib/cors';

export const runtime = 'nodejs';

// Handle CORS preflight
export async function OPTIONS() {
  return corsResponse(null, { status: 204 });
}

// POST /api/products/:id/export - Export product with all listings and QA data
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = (await request.json()) as CreateExportInput;

    if (!body.format) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Export format is required (pdf, zip, csv, json)',
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (!['pdf', 'zip', 'csv', 'json'].includes(body.format)) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid format. Supported: pdf, zip, csv, json',
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Get product
    const product = await Database.getProduct(params.id, userId);
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

    // Get Product Master
    const productMaster = await Database.getProductMaster(params.id, userId);
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

    // Get all listings for this product
    const listingsResult = await supabase
      .from('listings')
      .select('*, qa_results(*)')
      .eq('product_id', params.id)
      .eq('user_id', userId);

    if (listingsResult.error) {
      throw new Error(`Failed to fetch listings: ${listingsResult.error.message}`);
    }

    const allListings = listingsResult.data || [];

    // Get product images
    const images = await Database.listImages(userId, { productId: params.id });

    // Build export data
    const exportData = {
      product: {
        id: product.id,
        title: product.title,
        description: product.description,
        category: product.category,
        status: product.status,
        created_at: product.created_at,
        updated_at: product.updated_at,
      },
      productMaster: {
        id: productMaster.id,
        name: productMaster.name,
        description: productMaster.description,
        category: productMaster.category,
        sku: productMaster.sku,
        strengths: productMaster.strengths,
        target_customer: productMaster.target_customer,
        use_cases: productMaster.use_cases,
        keywords: productMaster.keywords,
        seo_score: productMaster.seo_score,
        specifications: productMaster.specifications,
        unsupported_claims: productMaster.unsupported_claims,
        confidence_score: productMaster.confidence_score,
      },
      listings: allListings.map((listing: any) => ({
        id: listing.id,
        platform: listing.platform,
        title: listing.title,
        description: listing.description,
        platform_data: listing.platform_data,
        status: listing.status,
        qa_passed: listing.qa_passed,
        qa_score: listing.qa_score,
        qa_result: listing.qa_results?.[0] || null,
        created_at: listing.created_at,
        updated_at: listing.updated_at,
      })),
      images: body.includeImages
        ? images.map((img: any) => ({
            id: img.id,
            url: img.url,
            alt_text: img.alt_text,
            created_at: img.created_at,
          }))
        : [],
      export_metadata: {
        generated_at: new Date().toISOString(),
        format: body.format,
        product_count: 1,
        listing_count: allListings.length,
        image_count: body.includeImages ? images.length : 0,
      },
    };

    // Format export based on requested format
    let content: string;
    let contentType: string;
    let filename: string;

    switch (body.format) {
      case 'json':
        content = JSON.stringify(exportData, null, 2);
        contentType = 'application/json';
        filename = `${product.title.replace(/\s+/g, '_')}_export.json`;
        break;

      case 'csv':
        content = generateCSV(exportData);
        contentType = 'text/csv';
        filename = `${product.title.replace(/\s+/g, '_')}_export.csv`;
        break;

      case 'zip':
        content = await generateZIP(exportData);
        contentType = 'application/zip';
        filename = `${product.title.replace(/\s+/g, '_')}_export.zip`;
        break;

      case 'pdf':
        content = generatePDF(exportData);
        contentType = 'application/pdf';
        filename = `${product.title.replace(/\s+/g, '_')}_export.pdf`;
        break;

      default:
        return corsResponse(
          {
            success: false,
            data: null,
            error: {
              code: 'INVALID_FORMAT',
              message: 'Unsupported export format',
            },
          } as ApiResponse,
          { status: 400 }
        );
    }

    // Log export event
    try {
      await supabase.from('usage_tracking').insert({
        user_id: userId,
        event_type: 'export_completed',
        event_data: {
          product_id: params.id,
          format: body.format,
          listing_count: allListings.length,
        },
      });
    } catch (err) {
      console.error('Failed to log export event:', err);
    }

    // Return file as response
    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('POST /api/products/:id/export error:', error);
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate export',
        },
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// Helper: Generate CSV export
function generateCSV(exportData: any): string {
  const rows: string[] = [];

  // Product info section
  rows.push('PRODUCT INFORMATION');
  rows.push(`Title,${escapeCsv(exportData.product.title)}`);
  rows.push(`Description,${escapeCsv(exportData.product.description)}`);
  rows.push(`Category,${exportData.product.category}`);
  rows.push(`Status,${exportData.product.status}`);
  rows.push('');

  // Product Master section
  rows.push('PRODUCT MASTER / ANALYSIS');
  rows.push(`SKU,${exportData.productMaster.sku}`);
  rows.push(`Target Customer,${escapeCsv(exportData.productMaster.target_customer)}`);
  rows.push(`SEO Score,${exportData.productMaster.seo_score}`);
  rows.push(
    `Strengths,"${(exportData.productMaster.strengths || []).join('; ')}"`
  );
  rows.push(
    `Use Cases,"${(exportData.productMaster.use_cases || []).join('; ')}"`
  );
  rows.push(
    `Keywords,"${(exportData.productMaster.keywords || []).join('; ')}"`
  );
  rows.push('');

  // Listings section
  rows.push('LISTINGS');
  rows.push('Platform,Title,Status,QA Passed,QA Score');
  exportData.listings.forEach((listing: any) => {
    rows.push(
      `${listing.platform},${escapeCsv(listing.title)},${listing.status},${listing.qa_passed},${listing.qa_score}`
    );
  });
  rows.push('');

  // QA Results section
  rows.push('QA RESULTS');
  rows.push('Platform,Fact Accuracy,SEO Quality,Platform Fit,Readability,Claim Safety,Total Score,Passed');
  exportData.listings.forEach((listing: any) => {
    if (listing.qa_result) {
      rows.push(
        `${listing.platform},${listing.qa_result.fact_accuracy},${listing.qa_result.seo_quality},${listing.qa_result.platform_fit},${listing.qa_result.readability},${listing.qa_result.claim_safety},${listing.qa_result.total_score},${listing.qa_result.passed}`
      );
    }
  });

  return rows.join('\n');
}

// Helper: Generate ZIP export (MVP returns JSON string, full ZIP support in V2)
async function generateZIP(exportData: any): Promise<string> {
  return JSON.stringify(exportData, null, 2);
}

// Helper: Generate PDF export (MVP returns text, full PDF support in V2)
function generatePDF(exportData: any): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('PRODUCT LAUNCH EXPORT');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(`Generated: ${exportData.export_metadata.generated_at}`);
  lines.push('');

  lines.push('PRODUCT INFORMATION');
  lines.push('-'.repeat(80));
  lines.push(`Title: ${exportData.product.title}`);
  lines.push(`Description: ${exportData.product.description}`);
  lines.push(`Category: ${exportData.product.category}`);
  lines.push(`Status: ${exportData.product.status}`);
  lines.push('');

  lines.push('PRODUCT MASTER / ANALYSIS');
  lines.push('-'.repeat(80));
  lines.push(`SKU: ${exportData.productMaster.sku}`);
  lines.push(
    `Target Customer: ${exportData.productMaster.target_customer}`
  );
  lines.push(`SEO Score: ${exportData.productMaster.seo_score}/100`);
  lines.push(
    `Strengths: ${(exportData.productMaster.strengths || []).join(', ')}`
  );
  lines.push(
    `Use Cases: ${(exportData.productMaster.use_cases || []).join(', ')}`
  );
  lines.push(
    `Keywords: ${(exportData.productMaster.keywords || []).join(', ')}`
  );
  lines.push('');

  lines.push('LISTINGS BY PLATFORM');
  lines.push('-'.repeat(80));
  exportData.listings.forEach((listing: any) => {
    lines.push('');
    lines.push(`Platform: ${listing.platform.toUpperCase()}`);
    lines.push(`Title: ${listing.title}`);
    lines.push(`Status: ${listing.status}`);
    if (listing.qa_result) {
      lines.push(`QA Score: ${listing.qa_score}/100`);
      lines.push(`  - Fact Accuracy: ${listing.qa_result.fact_accuracy}`);
      lines.push(`  - SEO Quality: ${listing.qa_result.seo_quality}`);
      lines.push(`  - Platform Fit: ${listing.qa_result.platform_fit}`);
      lines.push(`  - Readability: ${listing.qa_result.readability}`);
      lines.push(`  - Claim Safety: ${listing.qa_result.claim_safety}`);
    }
    lines.push('');
    lines.push(`Description:`);
    lines.push(listing.description);
  });

  lines.push('');
  lines.push('='.repeat(80));
  lines.push('END OF EXPORT');
  lines.push('='.repeat(80));

  return lines.join('\n');
}

// Helper: Escape CSV values
function escapeCsv(value: string): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

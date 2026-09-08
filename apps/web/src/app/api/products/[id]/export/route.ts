import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    if (!['json', 'csv', 'pdf', 'zip'].includes(format)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid format. Supported: json, csv, pdf, zip' },
        },
        { status: 400 }
      );
    }

    // Fetch all product data
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single();

    if (productError || !product) {
      throw new Error('Product not found');
    }

    const { data: productMaster } = await supabaseAdmin
      .from('product_masters')
      .select('*')
      .eq('product_id', params.id)
      .single();

    const { data: listings } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('product_id', params.id)
      .order('created_at', { ascending: false });

    const { data: qaResults } = await supabaseAdmin
      .from('qa_results')
      .select('*')
      .in('listing_id', listings?.map(l => l.id) || [])
      .order('created_at', { ascending: false });

    const exportData = {
      product,
      productMaster,
      listings,
      qaResults,
    };

    if (format === 'json') {
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="product-${params.id}.json"`,
        },
      });
    }

    if (format === 'csv') {
      const csv = generateCSV(exportData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="product-${params.id}.csv"`,
        },
      });
    }

    if (format === 'pdf') {
      // PDF generation would require a library like pdfkit or similar
      // For now, return a simple text/error message
      const pdf = generatePDFPlaceholder(exportData);
      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="product-${params.id}.pdf"`,
        },
      });
    }

    if (format === 'zip') {
      // ZIP generation would require a library like jszip
      // For now, return a simple text/error message
      return NextResponse.json(
        {
          success: false,
          error: { message: 'ZIP export not yet implemented' },
        },
        { status: 501 }
      );
    }

    throw new Error(`Unsupported format: ${format}`);
  } catch (error) {
    console.error(`POST /api/products/${params.id}/export error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Unknown error' },
      },
      { status: 500 }
    );
  }
}

function generateCSV(data: any): string {
  const rows: string[] = [];

  // Product info
  rows.push('Product Information');
  rows.push(`Title,${escapeCSV(data.product.title)}`);
  rows.push(`Description,${escapeCSV(data.product.description || '')}`);
  rows.push(`Category,${escapeCSV(data.product.category || '')}`);
  rows.push(`Status,${data.product.status}`);
  rows.push('');

  // Product Master
  if (data.productMaster) {
    rows.push('Product Analysis');
    rows.push(`SKU,${escapeCSV(data.productMaster.sku)}`);
    rows.push(`Product Name,${escapeCSV(data.productMaster.name)}`);
    rows.push(`Description,${escapeCSV(data.productMaster.description || '')}`);
    if (data.productMaster.strengths) {
      rows.push(`Strengths,${escapeCSV(data.productMaster.strengths.join('; '))}`);
    }
    if (data.productMaster.keywords) {
      rows.push(`Keywords,${escapeCSV(data.productMaster.keywords.join('; '))}`);
    }
    rows.push('');
  }

  // Listings
  if (data.listings && data.listings.length > 0) {
    rows.push('Platform Listings');
    rows.push('Platform,Title,Description');
    data.listings.forEach((listing: any) => {
      rows.push(`${listing.platform},${escapeCSV(listing.title)},${escapeCSV(listing.description)}`);
    });
    rows.push('');
  }

  // QA Results
  if (data.qaResults && data.qaResults.length > 0) {
    rows.push('Quality Assurance Results');
    rows.push('Listing ID,Total Score,Fact Accuracy,SEO Quality,Platform Fit,Readability,Claim Safety,Passed');
    data.qaResults.forEach((qa: any) => {
      rows.push(
        `${qa.listing_id},${qa.total_score},${qa.fact_accuracy},${qa.seo_quality},${qa.platform_fit},${qa.readability},${qa.claim_safety},${qa.passed ? 'Yes' : 'No'}`
      );
    });
  }

  return rows.join('\n');
}

function generatePDFPlaceholder(data: any): string {
  // Since we don't have pdfkit installed, return a simple text file that looks like PDF
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
BT
/F1 12 Tf
50 700 Td
(ListingKo Product Export) Tj
0 -20 Td
(${escapeForPDF(data.product.title)}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
500
%%EOF`;
  return content;
}

function escapeCSV(str: string | null | undefined): string {
  if (!str) return '""';
  return `"${(str + '').replace(/"/g, '""')}"`;
}

function escapeForPDF(str: string | null | undefined): string {
  if (!str) return '';
  return (str + '').replace(/[()\\]/g, '\\$&');
}

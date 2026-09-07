import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { ApiResponse, CreateExportInput } from 'https://esm.sh/@listingko/shared-types'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auth-token',
}

function corsResponse(body: unknown, init?: ResponseInit): Response {
  const response = new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...(init?.headers || {}),
    },
  })
  return response
}

async function getAuthUser(request: Request): Promise<string | undefined> {
  const authHeader = request.headers.get('authorization')?.replace('Bearer ', '') || ''
  const authToken = request.headers.get('x-auth-token') || ''
  const token = authHeader || authToken

  if (!token) {
    return undefined
  }

  console.log('[AUTH] TEMPORARY DEV BYPASS - accepting token')
  return '00000000-0000-0000-0000-000000000001'
}

function generateCSV(exportData: any): string {
  const lines: string[] = []

  // Product info
  lines.push('PRODUCT INFORMATION')
  lines.push(`Title,${exportData.product.title}`)
  lines.push(`Description,${exportData.product.description}`)
  lines.push(`Category,${exportData.product.category}`)
  lines.push(`Status,${exportData.product.status}`)
  lines.push('')

  // Product Master
  lines.push('PRODUCT MASTER')
  lines.push(`Name,${exportData.productMaster.name}`)
  lines.push(`SKU,${exportData.productMaster.sku}`)
  lines.push(`Category,${exportData.productMaster.category}`)
  lines.push(`Strengths,"${exportData.productMaster.strengths.join('; ')}"`)
  lines.push(`Keywords,"${exportData.productMaster.keywords.join('; ')}"`)
  lines.push(`SEO Score,${exportData.productMaster.seo_score}`)
  lines.push('')

  // Listings
  lines.push('LISTINGS')
  lines.push('Platform,Title,Status,QA Passed,QA Score')
  exportData.listings.forEach((listing: any) => {
    lines.push(`${listing.platform},"${listing.title}",${listing.status},${listing.qa_passed},${listing.qa_score}`)
  })

  return lines.join('\n')
}

export async function handler(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return corsResponse(null, { status: 204 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    const userId = await getAuthUser(request)
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
      )
    }

    // Extract product ID from URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const productId = pathParts[pathParts.length - 2] // export is last, product ID is second to last

    if (!productId) {
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
      )
    }

    if (request.method !== 'POST') {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: `Method ${request.method} not allowed`,
          },
        } as ApiResponse,
        { status: 405 }
      )
    }

    const body = (await request.json()) as CreateExportInput

    if (!body.format) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Export format is required (json, csv)',
          },
        } as ApiResponse,
        { status: 400 }
      )
    }

    if (!['json', 'csv'].includes(body.format)) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid format. Supported: json, csv',
          },
        } as ApiResponse,
        { status: 400 }
      )
    }

    // Get product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single()

    if (productError || !product) {
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
      )
    }

    // Get Product Master
    const { data: productMaster, error: masterError } = await supabase
      .from('product_masters')
      .select('*')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .single()

    if (masterError || !productMaster) {
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
      )
    }

    // Get listings
    const { data: allListings, error: listingsError } = await supabase
      .from('listings')
      .select('*, qa_results(*)')
      .eq('product_id', productId)
      .eq('user_id', userId)

    if (listingsError) throw listingsError

    // Get images
    const { data: images, error: imagesError } = await supabase
      .from('images')
      .select('*')
      .eq('product_id', productId)
      .eq('user_id', userId)

    if (imagesError) throw imagesError

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
      listings: (allListings || []).map((listing: any) => ({
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
        ? (images || []).map((img: any) => ({
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
        listing_count: allListings?.length || 0,
        image_count: body.includeImages ? images?.length || 0 : 0,
      },
    }

    // Format export
    let content: string
    let contentType: string

    if (body.format === 'json') {
      content = JSON.stringify(exportData, null, 2)
      contentType = 'application/json'
    } else {
      // CSV
      content = generateCSV(exportData)
      contentType = 'text/csv'
    }

    return corsResponse({
      success: true,
      data: {
        content,
        contentType,
        filename: `${product.title.replace(/\s+/g, '_')}_export.${body.format}`,
        format: body.format,
      },
      error: null,
    } as ApiResponse, { status: 200 })
  } catch (error) {
    console.error('Error in export handler:', error)
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      } as ApiResponse,
      { status: 500 }
    )
  }
}

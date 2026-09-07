import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { ApiResponse, QAResult } from 'https://esm.sh/@listingko/shared-types'

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

    // GET /qa-results?productId=...
    if (request.method === 'GET') {
      const url = new URL(request.url)
      const productId = url.searchParams.get('productId')

      if (!productId) {
        return corsResponse(
          {
            success: false,
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'productId is required',
            },
          } as ApiResponse,
          { status: 400 }
        )
      }

      // Fetch QA results for listings of this product
      const { data: results, error } = await supabase
        .from('qa_results')
        .select(`
          *,
          listing:listings(id, platform, status)
        `)
        .eq('user_id', userId)
        .eq('listings.product_id', productId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return corsResponse({
        success: true,
        data: results || [],
        error: null,
      } as ApiResponse<QAResult[]>, { status: 200 })
    }

    // POST /qa-results (Create QA result)
    if (request.method === 'POST') {
      const body = (await request.json()) as {
        listingId: string
        factAccuracy: number
        seoQuality: number
        platformFit: number
        readability: number
        claimSafety: number
        issues?: Record<string, string[]>
      }

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
          } as ApiResponse,
          { status: 400 }
        )
      }

      // Check listing exists and belongs to user
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', body.listingId)
        .eq('user_id', userId)
        .single()

      if (listingError || !listing) {
        return corsResponse(
          {
            success: false,
            data: null,
            error: {
              code: 'NOT_FOUND',
              message: 'Listing not found',
            },
          } as ApiResponse,
          { status: 404 }
        )
      }

      // Calculate total score (average of all scores)
      const totalScore = Math.round(
        (body.factAccuracy +
          body.seoQuality +
          body.platformFit +
          body.readability +
          body.claimSafety) /
          5
      )

      // Determine if passed (>= 85)
      const passed = totalScore >= 85

      // Create QA result
      const { data: qaResult, error: createError } = await supabase
        .from('qa_results')
        .insert([
          {
            listing_id: body.listingId,
            user_id: userId,
            fact_accuracy: body.factAccuracy,
            seo_quality: body.seoQuality,
            platform_fit: body.platformFit,
            readability: body.readability,
            claim_safety: body.claimSafety,
            total_score: totalScore,
            passed,
            issues: body.issues || {},
            attempted_repair: false,
          },
        ])
        .select()
        .single()

      if (createError) throw createError

      // Update listing with QA result
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          qa_result_id: qaResult.id,
          qa_passed: passed,
          qa_score: totalScore,
          status: passed ? 'QA_PASSED' : 'QA_FAILED',
        })
        .eq('id', body.listingId)
        .eq('user_id', userId)

      if (updateError) throw updateError

      return corsResponse({
        success: true,
        data: qaResult,
        error: null,
      } as ApiResponse<QAResult>, { status: 201 })
    }

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
  } catch (error) {
    console.error('Error in qa-results handler:', error)
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

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { ApiResponse, Listing, GenerateListingInput } from 'https://esm.sh/@listingko/shared-types'

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

    // GET /listings
    if (request.method === 'GET') {
      const url = new URL(request.url)
      const productId = url.searchParams.get('productId') || undefined
      const platform = url.searchParams.get('platform') || undefined
      const status = url.searchParams.get('status') || undefined

      let query = supabase.from('listings').select('*').eq('user_id', userId)

      if (productId) query = query.eq('product_id', productId)
      if (platform) query = query.eq('platform', platform)
      if (status) query = query.eq('status', status)

      const { data: listings, error } = await query

      if (error) throw error

      return corsResponse({
        success: true,
        data: {
          items: listings || [],
          total: listings?.length || 0,
        },
        error: null,
      } as ApiResponse)
    }

    // POST /listings (Generate)
    if (request.method === 'POST') {
      const body = (await request.json()) as GenerateListingInput

      // Validation
      if (!body.productId) {
        return corsResponse(
          {
            success: false,
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'productId is required',
              details: { field: 'productId' },
            },
          } as ApiResponse,
          { status: 400 }
        )
      }

      if (!body.platforms || body.platforms.length === 0) {
        return corsResponse(
          {
            success: false,
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'platforms array is required',
              details: { field: 'platforms' },
            },
          } as ApiResponse,
          { status: 400 }
        )
      }

      // Check product exists
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', body.productId)
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

      // Check product master exists
      const { data: productMaster, error: masterError } = await supabase
        .from('product_masters')
        .select('*')
        .eq('product_id', body.productId)
        .eq('user_id', userId)
        .single()

      if (masterError || !productMaster) {
        return corsResponse(
          {
            success: false,
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Product analysis required before generating listings',
              details: { requiresAnalysis: true },
            },
          } as ApiResponse,
          { status: 400 }
        )
      }

      // Create listings for each platform
      const createdListings: Listing[] = []
      for (const platform of body.platforms) {
        const { data: listing, error: createError } = await supabase
          .from('listings')
          .insert([
            {
              product_id: body.productId,
              product_master_id: productMaster.id,
              user_id: userId,
              platform: platform,
              status: 'DRAFT',
              content: null,
            },
          ])
          .select()
          .single()

        if (createError) throw createError
        if (listing) createdListings.push(listing)
      }

      return corsResponse({
        success: true,
        data: {
          items: createdListings,
          total: createdListings.length,
        },
        error: null,
      } as ApiResponse, { status: 201 })
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
    console.error('Error in listings handler:', error)
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

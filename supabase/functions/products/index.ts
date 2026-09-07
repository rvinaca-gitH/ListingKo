import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { ApiResponse, CreateProductInput, Product, PaginatedResponse } from 'https://esm.sh/@listingko/shared-types'

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

  // TEMPORARY DEV MODE: accept any token
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

    // GET /products - List user's products
    if (request.method === 'GET') {
      const url = new URL(request.url)
      const limit = parseInt(url.searchParams.get('limit') || '50', 10)
      const offset = parseInt(url.searchParams.get('offset') || '0', 10)

      const { data: products, error, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return corsResponse({
        success: true,
        data: {
          items: products || [],
          total: count || 0,
          hasMore: offset + limit < (count || 0),
        } as PaginatedResponse<Product>,
        error: null,
      } as ApiResponse<PaginatedResponse<Product>>)
    }

    // POST /products - Create new product
    if (request.method === 'POST') {
      const body = (await request.json()) as CreateProductInput

      // Validation
      if (!body.title || body.title.trim().length === 0) {
        return corsResponse(
          {
            success: false,
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Title is required',
              details: { field: 'title' },
            },
          } as ApiResponse,
          { status: 400 }
        )
      }

      // Create product
      const { data: product, error } = await supabase
        .from('products')
        .insert([
          {
            user_id: userId,
            title: body.title.trim(),
            description: body.description?.trim() || '',
            category: body.category?.trim() || '',
            status: 'DRAFT',
            free_tier_used: false,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return corsResponse(
        {
          success: true,
          data: product,
          error: null,
        } as ApiResponse<Product>,
        { status: 201 }
      )
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
    console.error('Error in products handler:', error)
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

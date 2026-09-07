import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { ApiResponse, Product, UpdateProductInput } from 'https://esm.sh/@listingko/shared-types'

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

    // Extract product ID from URL path
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const productId = pathParts[pathParts.length - 1]

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

    // GET /products/:id
    if (request.method === 'GET') {
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

      // Fetch related data
      const { data: productMaster } = await supabase
        .from('product_masters')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .single()

      const { data: listings } = await supabase
        .from('listings')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', userId)

      const { data: images } = await supabase
        .from('images')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', userId)

      return corsResponse({
        success: true,
        data: {
          ...product,
          productMaster,
          listings: listings || [],
          images: images || [],
        },
        error: null,
      } as ApiResponse)
    }

    // PATCH /products/:id or PUT /products/:id
    if (request.method === 'PATCH' || request.method === 'PUT') {
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

      const body = (await request.json()) as UpdateProductInput

      const { data: updated, error: updateError } = await supabase
        .from('products')
        .update({
          ...(body.title && { title: body.title.trim() }),
          ...(body.description && { description: body.description.trim() }),
          ...(body.category && { category: body.category.trim() }),
        })
        .eq('id', productId)
        .eq('user_id', userId)
        .select()
        .single()

      if (updateError) throw updateError

      return corsResponse({
        success: true,
        data: updated,
        error: null,
      } as ApiResponse<Product>)
    }

    // DELETE /products/:id
    if (request.method === 'DELETE') {
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

      const { error: deleteError } = await supabase
        .from('products')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', productId)
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      return corsResponse({
        success: true,
        data: { id: productId },
        error: null,
      } as ApiResponse)
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
    console.error('Error in products-detail handler:', error)
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

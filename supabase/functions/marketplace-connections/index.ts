import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { ApiResponse } from 'https://esm.sh/@listingko/shared-types'

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

    // GET /marketplace-connections
    if (request.method === 'GET') {
      const url = new URL(request.url)
      const connectionId = url.pathname.split('/').pop()

      // If connectionId exists, this is a detail request - redirect to marketplace-connections-detail
      if (connectionId && connectionId !== 'marketplace-connections') {
        return corsResponse(
          {
            success: false,
            data: null,
            error: {
              code: 'NOT_FOUND',
              message: 'Use marketplace-connections-detail endpoint for individual connections',
            },
          } as ApiResponse,
          { status: 404 }
        )
      }

      const { data: connections, error } = await supabase
        .from('marketplace_connections')
        .select('id, marketplace, status, shop_id, shop_name, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return corsResponse({
        success: true,
        data: connections || [],
        error: null,
      } as ApiResponse<any[]>, { status: 200 })
    }

    // POST /marketplace-connections
    if (request.method === 'POST') {
      const body = (await request.json()) as {
        marketplace: string
        credentials?: {
          apiKey?: string
          apiSecret?: string
          shopId?: string
          accessToken?: string
        }
        shopId?: string
        shopName?: string
      }

      // Validation
      if (!body.marketplace || !['shopee', 'lazada', 'tiktok', 'facebook'].includes(body.marketplace)) {
        return corsResponse(
          {
            success: false,
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid marketplace',
            },
          } as ApiResponse,
          { status: 400 }
        )
      }

      // Check if connection already exists
      const { data: existing } = await supabase
        .from('marketplace_connections')
        .select('id')
        .eq('user_id', userId)
        .eq('marketplace', body.marketplace)
        .single()

      if (existing) {
        return corsResponse(
          {
            success: false,
            data: null,
            error: {
              code: 'ALREADY_EXISTS',
              message: `${body.marketplace} connection already exists`,
            },
          } as ApiResponse,
          { status: 409 }
        )
      }

      // TODO: Implement real encryption
      const credentialsEncrypted = JSON.stringify(body.credentials || {})
      const credentialsIv = 'placeholder-iv'

      const { data: result, error: createError } = await supabase
        .from('marketplace_connections')
        .insert({
          user_id: userId,
          marketplace: body.marketplace,
          credentials_encrypted: credentialsEncrypted,
          credentials_iv: credentialsIv,
          status: 'CONNECTED',
          shop_id: body.shopId,
          shop_name: body.shopName,
        })
        .select()
        .single()

      if (createError) throw createError

      return corsResponse({
        success: true,
        data: result,
        error: null,
      } as ApiResponse<any>, { status: 201 })
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
    console.error('Error in marketplace-connections handler:', error)
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

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

    // Extract connection ID from URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const connectionId = pathParts[pathParts.length - 1]

    if (!connectionId) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Connection ID is required',
          },
        } as ApiResponse,
        { status: 400 }
      )
    }

    // GET /marketplace-connections/:id
    if (request.method === 'GET') {
      const { data: connection, error } = await supabase
        .from('marketplace_connections')
        .select('*')
        .eq('id', connectionId)
        .eq('user_id', userId)
        .single()

      if (error || !connection) {
        return corsResponse(
          {
            success: false,
            data: null,
            error: {
              code: 'NOT_FOUND',
              message: 'Connection not found',
            },
          } as ApiResponse,
          { status: 404 }
        )
      }

      return corsResponse({
        success: true,
        data: connection,
        error: null,
      } as ApiResponse<any>, { status: 200 })
    }

    // PUT /marketplace-connections/:id
    if (request.method === 'PUT') {
      const body = (await request.json()) as {
        status?: string
        shop_id?: string
        shop_name?: string
      }

      const { data: result, error } = await supabase
        .from('marketplace_connections')
        .update({
          ...(body.status && { status: body.status }),
          ...(body.shop_id && { shop_id: body.shop_id }),
          ...(body.shop_name && { shop_name: body.shop_name }),
        })
        .eq('id', connectionId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      return corsResponse({
        success: true,
        data: result,
        error: null,
      } as ApiResponse<any>, { status: 200 })
    }

    // DELETE /marketplace-connections/:id
    if (request.method === 'DELETE') {
      const { error } = await supabase
        .from('marketplace_connections')
        .delete()
        .eq('id', connectionId)
        .eq('user_id', userId)

      if (error) throw error

      return corsResponse({
        success: true,
        data: null,
        error: null,
      } as ApiResponse, { status: 200 })
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
    console.error('Error in marketplace-connections-detail handler:', error)
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

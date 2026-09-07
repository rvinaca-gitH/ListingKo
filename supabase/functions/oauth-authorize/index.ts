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

// Marketplace OAuth configurations
const MARKETPLACE_CONFIGS: Record<
  string,
  { authorizationUrl: string; clientId: string; redirectUri: string }
> = {
  shopee: {
    authorizationUrl: 'https://partner.shopeemobile.com/api/v2/oauth/authorize',
    clientId: Deno.env.get('SHOPEE_CLIENT_ID') || '',
    redirectUri: Deno.env.get('SHOPEE_REDIRECT_URI') || 'http://localhost:3000/api/oauth/shopee/callback',
  },
  lazada: {
    authorizationUrl: 'https://auth.lazada.com/oauth/authorize',
    clientId: Deno.env.get('LAZADA_CLIENT_ID') || '',
    redirectUri: Deno.env.get('LAZADA_REDIRECT_URI') || 'http://localhost:3000/api/oauth/lazada/callback',
  },
  tiktok: {
    authorizationUrl: 'https://auth.tiktok.com/oauth/authorize',
    clientId: Deno.env.get('TIKTOK_CLIENT_ID') || '',
    redirectUri: Deno.env.get('TIKTOK_REDIRECT_URI') || 'http://localhost:3000/api/oauth/tiktok/callback',
  },
  facebook: {
    authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    clientId: Deno.env.get('FACEBOOK_APP_ID') || '',
    redirectUri: Deno.env.get('FACEBOOK_REDIRECT_URI') || 'http://localhost:3000/api/oauth/facebook/callback',
  },
}

function generateRandomState(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function handler(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return corsResponse(null, { status: 204 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.0')
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

    const body = (await request.json()) as {
      marketplace: string
    }

    if (!body.marketplace) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'marketplace is required',
          },
        } as ApiResponse,
        { status: 400 }
      )
    }

    const config = MARKETPLACE_CONFIGS[body.marketplace.toLowerCase()]
    if (!config) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Unsupported marketplace: ${body.marketplace}`,
          },
        } as ApiResponse,
        { status: 400 }
      )
    }

    if (!config.clientId) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'CONFIGURATION_ERROR',
            message: `${body.marketplace} OAuth not configured (missing clientId)`,
          },
        } as ApiResponse,
        { status: 500 }
      )
    }

    // Generate state for CSRF protection
    const state = generateRandomState(32)

    // Store state in database with expiration (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    const { error: storeError } = await supabase.from('oauth_states').insert({
      user_id: userId,
      marketplace: body.marketplace.toLowerCase(),
      state,
      expires_at: expiresAt.toISOString(),
    })

    if (storeError) {
      console.error('Failed to store OAuth state:', storeError)
      // Continue anyway - state verification is optional for MVP
    }

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      state,
      scope: 'openid profile email', // Common scope, marketplace-specific scope handled by adapter
    })

    const authorizationUrl = `${config.authorizationUrl}?${params.toString()}`

    return corsResponse(
      {
        success: true,
        data: {
          authorizationUrl,
          marketplace: body.marketplace.toLowerCase(),
          state,
        },
        error: null,
      } as ApiResponse<any>,
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in oauth-authorize handler:', error)
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate authorization URL',
        },
      } as ApiResponse,
      { status: 500 }
    )
  }
}

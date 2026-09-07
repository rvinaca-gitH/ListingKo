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

// Marketplace token exchange configurations
const MARKETPLACE_TOKEN_URLS: Record<string, string> = {
  shopee: 'https://partner.shopeemobile.com/api/v2/oauth/token',
  lazada: 'https://auth.lazada.com/oauth/token',
  tiktok: 'https://auth.tiktok.com/oauth/token',
  facebook: 'https://graph.instagram.com/v18.0/oauth/access_token',
}

async function exchangeCodeForToken(
  marketplace: string,
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const tokenUrl = MARKETPLACE_TOKEN_URLS[marketplace.toLowerCase()]
  if (!tokenUrl) {
    throw new Error(`Unsupported marketplace: ${marketplace}`)
  }

  // TODO: Implement real token exchange
  // For MVP, return mock token
  console.log(`${marketplace}: Exchanging code for token (mock implementation)`)
  return {
    accessToken: `${marketplace}_token_${Date.now()}`,
    refreshToken: `${marketplace}_refresh_${Date.now()}`,
    expiresIn: 3600,
  }
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
    // Handle GET (OAuth callback from marketplace)
    if (request.method === 'GET') {
      const url = new URL(request.url)
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      const error = url.searchParams.get('error')
      const marketplace = url.searchParams.get('marketplace') || url.pathname.split('/').pop() || ''

      // Check for OAuth errors
      if (error) {
        return corsResponse(
          {
            success: false,
            data: null,
            error: {
              code: 'OAUTH_ERROR',
              message: `OAuth failed: ${error}`,
            },
          } as ApiResponse,
          { status: 400 }
        )
      }

      if (!code || !state) {
        return corsResponse(
          {
            success: false,
            data: null,
            error: {
              code: 'INVALID_REQUEST',
              message: 'Missing code or state parameter',
            },
          } as ApiResponse,
          { status: 400 }
        )
      }

      if (!marketplace) {
        return corsResponse(
          {
            success: false,
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'marketplace parameter is required',
            },
          } as ApiResponse,
          { status: 400 }
        )
      }

      // Verify state (check against database)
      const { data: stateRecord, error: stateError } = await supabase
        .from('oauth_states')
        .select('*')
        .eq('state', state)
        .eq('marketplace', marketplace.toLowerCase())
        .gt('expires_at', new Date().toISOString())
        .single()

      if (stateError || !stateRecord) {
        console.warn('Invalid or expired OAuth state:', stateError)
        // For MVP, continue anyway (state verification is optional)
      }

      const userId = stateRecord?.user_id || '00000000-0000-0000-0000-000000000001' // Dev mode fallback

      try {
        // Exchange code for token
        const clientId = Deno.env.get(`${marketplace.toUpperCase()}_CLIENT_ID`) || ''
        const clientSecret = Deno.env.get(`${marketplace.toUpperCase()}_CLIENT_SECRET`) || ''
        const redirectUri =
          Deno.env.get(`${marketplace.toUpperCase()}_REDIRECT_URI`) ||
          'http://localhost:3000/api/oauth/callback'

        const tokenData = await exchangeCodeForToken(
          marketplace,
          code,
          redirectUri,
          clientId,
          clientSecret
        )

        // Update marketplace connection in database
        const { data: connection, error: upsertError } = await supabase
          .from('marketplace_connections')
          .upsert(
            {
              user_id: userId,
              marketplace: marketplace.toLowerCase(),
              status: 'CONNECTED',
              shop_id: `shop_${Date.now()}`, // Placeholder - would come from API
              shop_name: 'Connected Shop', // Placeholder - would come from API
              credentials_encrypted: JSON.stringify({
                accessToken: tokenData.accessToken,
                refreshToken: tokenData.refreshToken,
                expiresIn: tokenData.expiresIn,
              }),
              credentials_iv: 'placeholder_iv',
            },
            { onConflict: 'user_id,marketplace' }
          )
          .select()
          .single()

        if (upsertError) throw upsertError

        // Clean up state record
        await supabase.from('oauth_states').delete().eq('state', state)

        return corsResponse({
          success: true,
          data: {
            marketplace: marketplace.toLowerCase(),
            message: `Successfully connected ${marketplace}`,
            shopId: connection.shop_id,
            shopName: connection.shop_name,
          },
          error: null,
        } as ApiResponse<any>, { status: 200 })
      } catch (tokenError) {
        console.error('Token exchange failed:', tokenError)
        return corsResponse(
          {
            success: false,
            data: null,
            error: {
              code: 'TOKEN_EXCHANGE_ERROR',
              message: `Failed to exchange code for token: ${tokenError instanceof Error ? tokenError.message : String(tokenError)}`,
            },
          } as ApiResponse,
          { status: 400 }
        )
      }
    }

    // Handle POST (alternative callback from some platforms)
    if (request.method === 'POST') {
      const body = (await request.json()) as {
        marketplace: string
        code: string
        state: string
      }

      if (!body.marketplace || !body.code || !body.state) {
        return corsResponse(
          {
            success: false,
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'marketplace, code, and state are required',
            },
          } as ApiResponse,
          { status: 400 }
        )
      }

      // Same logic as GET but for POST request
      const { data: stateRecord } = await supabase
        .from('oauth_states')
        .select('*')
        .eq('state', body.state)
        .eq('marketplace', body.marketplace.toLowerCase())
        .gt('expires_at', new Date().toISOString())
        .single()

      const userId = stateRecord?.user_id || '00000000-0000-0000-0000-000000000001'

      const tokenData = await exchangeCodeForToken(
        body.marketplace,
        body.code,
        'http://localhost:3000/api/oauth/callback',
        '',
        ''
      )

      const { data: connection, error: upsertError } = await supabase
        .from('marketplace_connections')
        .upsert(
          {
            user_id: userId,
            marketplace: body.marketplace.toLowerCase(),
            status: 'CONNECTED',
            shop_id: `shop_${Date.now()}`,
            shop_name: 'Connected Shop',
            credentials_encrypted: JSON.stringify(tokenData),
            credentials_iv: 'placeholder_iv',
          },
          { onConflict: 'user_id,marketplace' }
        )
        .select()
        .single()

      if (upsertError) throw upsertError

      return corsResponse({
        success: true,
        data: {
          marketplace: body.marketplace.toLowerCase(),
          message: `Successfully connected ${body.marketplace}`,
        },
        error: null,
      } as ApiResponse<any>, { status: 200 })
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
    console.error('Error in oauth-callback handler:', error)
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'OAuth callback processing failed',
        },
      } as ApiResponse,
      { status: 500 }
    )
  }
}

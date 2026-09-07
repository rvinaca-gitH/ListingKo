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

    // Extract image ID from URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const imageId = pathParts[pathParts.length - 1]

    if (!imageId) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Image ID is required',
          },
        } as ApiResponse,
        { status: 400 }
      )
    }

    // GET /images/:id
    if (request.method === 'GET') {
      const { data: image, error } = await supabase
        .from('images')
        .select('*')
        .eq('id', imageId)
        .eq('user_id', userId)
        .single()

      if (error || !image) {
        return corsResponse(
          {
            success: false,
            data: null,
            error: {
              code: 'NOT_FOUND',
              message: 'Image not found',
            },
          } as ApiResponse,
          { status: 404 }
        )
      }

      return corsResponse(
        {
          success: true,
          data: image,
          error: null,
        } as ApiResponse<any>,
        { status: 200 }
      )
    }

    // DELETE /images/:id
    if (request.method === 'DELETE') {
      // Get image to find storage path
      const { data: image, error: getError } = await supabase
        .from('images')
        .select('*')
        .eq('id', imageId)
        .eq('user_id', userId)
        .single()

      if (getError || !image) {
        return corsResponse(
          {
            success: false,
            data: null,
            error: {
              code: 'NOT_FOUND',
              message: 'Image not found',
            },
          } as ApiResponse,
          { status: 404 }
        )
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('images')
        .delete()
        .eq('id', imageId)
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      // TODO: Delete from Supabase storage
      // For now, just return success
      console.log(`Deleted image ${imageId} from database`)

      return corsResponse({
        success: true,
        data: { id: imageId },
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
    console.error('Error in images-detail handler:', error)
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to process image',
        },
      } as ApiResponse,
      { status: 500 }
    )
  }
}

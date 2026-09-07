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

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const productId = formData.get('productId') as string | null

    if (!file || !productId) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'file and productId are required',
          },
        } as ApiResponse,
        { status: 400 }
      )
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedMimeTypes.includes(file.type)) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'INVALID_FILE',
            message: 'Only JPEG, PNG, WebP, and GIF images are allowed',
          },
        } as ApiResponse,
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File must be smaller than 10MB',
          },
        } as ApiResponse,
        { status: 400 }
      )
    }

    // Convert File to ArrayBuffer, then to Uint8Array for Deno
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Generate unique filename
    const timestamp = Date.now()
    const storagePath = `products/${userId}/${productId}/${timestamp}-${file.name}`

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(storagePath)

    const urlOriginal = urlData.publicUrl

    // Store image metadata in database
    const { data: imageRecord, error: dbError } = await supabase
      .from('images')
      .insert({
        product_id: productId,
        user_id: userId,
        url_original: urlOriginal,
        type: 'USER_UPLOAD',
        original_filename: file.name,
        size_bytes: file.size,
        width: 1200, // Default - would need image processing library for actual dimensions
        height: 800,
      })
      .select()
      .single()

    if (dbError) throw dbError

    return corsResponse(
      {
        success: true,
        data: {
          imageId: imageRecord.id,
          urlOriginal,
          width: imageRecord.width,
          height: imageRecord.height,
          sizeBytes: imageRecord.size_bytes,
        },
        error: null,
      } as ApiResponse<any>,
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in images-upload handler:', error)
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to upload image',
        },
      } as ApiResponse,
      { status: 500 }
    )
  }
}

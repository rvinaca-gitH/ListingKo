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

function generateImagePrompt(
  productName: string,
  productDescription: string,
  imageType: string
): string {
  const typePrompts: Record<string, string> = {
    hero: `Create a professional product hero image for ${productName}. ${productDescription} The image should be high-quality, well-lit, centered, and suitable for product listings on ecommerce platforms.`,
    lifestyle: `Create a lifestyle image showing ${productName} in use. ${productDescription} The image should show the product in a real-world setting that appeals to potential customers.`,
    detail: `Create a detailed close-up image of ${productName}. ${productDescription} Focus on the product's features, texture, and quality. High resolution and professional lighting.`,
    context: `Create a contextual image showing ${productName} in an appropriate environment. ${productDescription} The image should help customers understand how to use or apply the product.`,
  }

  return typePrompts[imageType] || typePrompts.hero
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

    const body = (await request.json()) as {
      productId: string
      imageTypes?: string[]
    }

    if (!body.productId) {
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

    // Get product details
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

    // Get product master for more details
    const { data: productMaster } = await supabase
      .from('product_masters')
      .select('*')
      .eq('product_id', body.productId)
      .eq('user_id', userId)
      .single()

    const productName = productMaster?.name || product.title || 'Product'
    const productDescription = productMaster?.description || product.description || ''

    // Image types to generate (default: all)
    const imageTypes = body.imageTypes || ['hero', 'lifestyle', 'detail', 'context']

    // Generate image records for each type
    const generatedImages = []

    for (const imageType of imageTypes) {
      const prompt = generateImagePrompt(productName, productDescription, imageType)

      // TODO: Replace with actual image generation API (Stability AI, DALL-E, etc.)
      // For MVP, use placeholder

      console.log(`Generating ${imageType} image for ${productName}:`, prompt)

      const mockImageUrl = `https://placeholder.com/1200x800?text=${encodeURIComponent(`${productName} - ${imageType}`)}`
      const mockImageId = `ai_${Date.now()}_${imageType}`

      // Store in database
      const { data: imageRecord, error: dbError } = await supabase
        .from('images')
        .insert({
          product_id: body.productId,
          user_id: userId,
          url_original: mockImageUrl,
          type: 'AI_GENERATED',
          ai_prompt: prompt,
          ai_version: 'stability-ai', // TODO: Use real API
          ai_model: 'stable-diffusion-3', // TODO: Update when real API integrated
          purposes: [imageType],
          width: 1200,
          height: 800,
        })
        .select()
        .single()

      if (dbError) {
        console.error(`Failed to store ${imageType} image:`, dbError)
        continue
      }

      generatedImages.push({
        imageId: imageRecord.id,
        imageType,
        urlOriginal: imageRecord.url_original,
        prompt,
        aiModel: imageRecord.ai_model,
      })
    }

    if (generatedImages.length === 0) {
      return corsResponse(
        {
          success: false,
          data: null,
          error: {
            code: 'GENERATION_FAILED',
            message: 'Failed to generate any images',
          },
        } as ApiResponse,
        { status: 500 }
      )
    }

    return corsResponse(
      {
        success: true,
        data: {
          images: generatedImages,
          count: generatedImages.length,
          message: `Generated ${generatedImages.length} product images`,
        },
        error: null,
      } as ApiResponse<any>,
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in images-generate handler:', error)
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate images',
        },
      } as ApiResponse,
      { status: 500 }
    )
  }
}

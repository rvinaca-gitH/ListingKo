import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { ApiResponse, ProductMaster } from 'https://esm.sh/@listingko/shared-types'

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

async function callClaude(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxTokens: number = 1024
): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-1-20250805',
      max_tokens: maxTokens,
      messages,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${response.status} - ${error}`)
  }

  const data = (await response.json()) as any
  const textContent = data.content.find((block: any) => block.type === 'text')
  if (!textContent || !textContent.text) {
    throw new Error('No text content in Claude response')
  }

  return textContent.text
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

    // Extract product ID from URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const productId = pathParts[pathParts.length - 2] // analyze is last, product ID is second to last

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

    // POST /products/:id/analyze
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

    // Check if already analyzed
    const { data: existing } = await supabase
      .from('product_masters')
      .select('*')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      return corsResponse({
        success: true,
        data: existing,
        error: null,
      } as ApiResponse<ProductMaster>)
    }

    // Update product status to ANALYZING
    await supabase
      .from('products')
      .update({ status: 'ANALYZING' })
      .eq('id', productId)
      .eq('user_id', userId)

    try {
      // Call Claude API
      const analysisPrompt = `Analyze this ecommerce product and create a comprehensive product master.

Product Title: ${product.title}
Product Description: ${product.description || ''}
${product.category ? `Category: ${product.category}` : ''}

Provide a JSON response with this exact structure (no markdown):
{
  "name": "product name",
  "description": "detailed description",
  "category": "category",
  "sku": "UPPERCASE-SKU-123",
  "strengths": ["strength 1", "strength 2", "strength 3", "strength 4", "strength 5"],
  "target_customer": "target customer description",
  "use_cases": ["use case 1", "use case 2", "use case 3"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "seo_score": 85,
  "confidence_score": 0.95,
  "specifications": {"key": "value"},
  "unsupported_claims": ["claim to avoid"]
}`

      const response = await callClaude([{ role: 'user', content: analysisPrompt }], 1500)

      let masterData
      try {
        masterData = JSON.parse(response)
      } catch (error) {
        console.error('Failed to parse Claude response:', response)
        throw new Error('Failed to parse product analysis response')
      }

      // Create product master
      const { data: productMaster, error: createError } = await supabase
        .from('product_masters')
        .insert([
          {
            product_id: productId,
            user_id: userId,
            name: masterData.name || product.title,
            description: masterData.description || product.description || '',
            category: masterData.category || product.category || 'General',
            sku: masterData.sku || 'SKU-001',
            strengths: masterData.strengths || [],
            target_customer: masterData.target_customer || 'General',
            use_cases: masterData.use_cases || [],
            keywords: masterData.keywords || [],
            seo_score: masterData.seo_score || 75,
            specifications: masterData.specifications || {},
            unsupported_claims: masterData.unsupported_claims || [],
            confidence_score: masterData.confidence_score || 0.85,
          },
        ])
        .select()
        .single()

      if (createError) throw createError

      // Update product status to READY
      await supabase
        .from('products')
        .update({ status: 'READY' })
        .eq('id', productId)
        .eq('user_id', userId)

      return corsResponse({
        success: true,
        data: productMaster,
        error: null,
      } as ApiResponse<ProductMaster>, { status: 201 })
    } catch (aiError) {
      // Update product status back to DRAFT on error
      await supabase
        .from('products')
        .update({ status: 'DRAFT' })
        .eq('id', productId)
        .eq('user_id', userId)

      throw aiError
    }
  } catch (error) {
    console.error('Error in analyze handler:', error)
    return corsResponse(
      {
        success: false,
        data: null,
        error: {
          code: error instanceof Error && error.message.includes('Claude') ? 'AI_ERROR' : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to analyze product',
        },
      } as ApiResponse,
      { status: 500 }
    )
  }
}

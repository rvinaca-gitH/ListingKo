import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

const DEV_USER_ID = 'a1111111-1111-1111-1111-111111111111';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Missing productId' },
        },
        { status: 400 }
      );
    }

    // Get product and product master
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Product not found' },
        },
        { status: 404 }
      );
    }

    const { data: productMaster } = await supabaseAdmin
      .from('product_masters')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (!productMaster) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Product master not found. Please analyze product first.' },
        },
        { status: 400 }
      );
    }

    // Generate images using Hugging Face Inference API (free)
    const hfApiKey = process.env.HUGGING_FACE_API_KEY;

    console.log('HUGGING_FACE_API_KEY configured:', !!hfApiKey);

    if (!hfApiKey) {
      console.error('HUGGING_FACE_API_KEY not configured');
      return NextResponse.json(
        {
          success: false,
          error: { message: 'AI image generation requires HUGGING_FACE_API_KEY. Create a free account at https://huggingface.co and get an API token from https://huggingface.co/settings/tokens' },
        },
        { status: 500 }
      );
    }

    const prompts = [
      `Professional product photo of ${productMaster.name}. Product photography, studio lighting, white background, high quality, professional`,
      `Lifestyle photo showing ${productMaster.name} in use. Lifestyle photography, realistic setting, modern aesthetic`,
      `Hero product image for ecommerce: ${productMaster.name}. Marketing photography, professional, clean background, product focused`,
    ];

    const generatedImages = [];
    const models = [
      'black-forest-labs/FLUX.1-dev',
      'stabilityai/stable-diffusion-2-1',
      'runwayml/stable-diffusion-v1-5',
    ];

    for (let i = 0; i < prompts.length; i++) {
      let generated = false;
      let lastError: Error | null = null;

      // Try different models until one succeeds
      for (const model of models) {
        try {
          console.log(`Attempting to generate image ${i + 1}/3 with model: ${model}`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

          let imageBuffer: Buffer | null = null;

          const response = await fetch(
            `https://api-inference.huggingface.co/models/${model}`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${hfApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                inputs: prompts[i],
              }),
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`${model}: ${response.status} ${errorData}`);
          }

          imageBuffer = await response.buffer();

          if (!imageBuffer) continue;

          // Upload to Supabase Storage
          const fileName = `${productId}/${Date.now()}-generated-${i}.jpg`;

          const { error: uploadError } = await supabaseAdmin.storage
            .from('product-images')
            .upload(fileName, imageBuffer, {
              cacheControl: '3600',
              contentType: 'image/jpeg',
            });

          if (uploadError) {
            console.error('Storage upload failed:', uploadError);
            continue;
          }

          // Get public URL
          const { data: urlData } = supabaseAdmin.storage
            .from('product-images')
            .getPublicUrl(fileName);

          // Store image metadata
          const { data: imageData } = await supabaseAdmin
            .from('images')
            .insert([
              {
                product_id: productId,
                user_id: DEV_USER_ID,
                url_original: urlData.publicUrl,
                url_medium: urlData.publicUrl,
                url_large: urlData.publicUrl,
                type: 'AI_GENERATED',
                ai_prompt: prompts[i],
                ai_model: isDevelopment && imageBuffer ? 'demo-placeholder' : model,
                ai_version: '1.0',
                mime_type: 'image/jpeg',
                size_bytes: imageBuffer.length,
              },
            ])
            .select()
            .single();

          if (imageData) {
            generatedImages.push(imageData);
            generated = true;
            break;
          }
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.error(`Error with model ${model}:`, lastError);
        }
      }

      if (!generated && lastError) {
        console.error(`Failed to generate image ${i} with all models:`, lastError.message);
      }
    }

    console.log(`Image generation complete. Generated ${generatedImages.length} images`);

    if (generatedImages.length === 0) {
      console.warn('No images were successfully generated');
    }

    return NextResponse.json({
      success: true,
      data: {
        images: generatedImages,
      },
    });
  } catch (error) {
    console.error('POST /api/images/generate error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', { errorMessage });
    return NextResponse.json(
      {
        success: false,
        error: { message: errorMessage },
      },
      { status: 500 }
    );
  }
}

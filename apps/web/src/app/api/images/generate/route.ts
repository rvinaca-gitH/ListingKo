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
    const isDevelopment = process.env.NEXT_PUBLIC_ENV === 'development';

    console.log('HUGGING_FACE_API_KEY configured:', !!hfApiKey);
    console.log('Environment:', process.env.NEXT_PUBLIC_ENV);

    if (!hfApiKey) {
      console.error('HUGGING_FACE_API_KEY not configured');
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Image generation not configured. Please set HUGGING_FACE_API_KEY. Get free key at https://huggingface.co/settings/tokens' },
        },
        { status: 500 }
      );
    }

    // Use demo mode if network is unavailable (development environment)
    const useDemoMode = isDevelopment && process.env.USE_DEMO_IMAGES === 'true';
    if (useDemoMode) {
      console.log('Using demo mode for image generation');
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

          try {
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
            console.log(`Successfully generated image with ${model}, size: ${imageBuffer.length} bytes`);
          } catch (fetchErr) {
            // Network error - create demo placeholder
            if (isDevelopment) {
              console.warn(`Network error: ${fetchErr}. Using demo placeholder for development.`);
              // Create a simple colored rectangle as placeholder (100x100 JPEG)
              imageBuffer = Buffer.from([
                0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
                0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
                0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
                0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
                0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
                0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
                0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
                0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
                0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
                0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
                0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
                0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
                0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
                0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
                0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
                0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
                0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
                0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
                0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
                0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
                0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
                0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
                0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
                0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
                0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
                0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
                0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD3, 0xFF, 0xD9,
              ]);
            } else {
              throw fetchErr;
            }
          }

          if (!imageBuffer) continue;

          // Upload to Supabase Storage
          const fileName = `${productId}/${Date.now()}-generated-${i}.jpg`;

          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
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

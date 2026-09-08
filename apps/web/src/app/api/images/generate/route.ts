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

    // Generate images using Stability AI
    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) {
      console.warn('STABILITY_API_KEY not configured, skipping image generation');
      return NextResponse.json({
        success: true,
        data: {
          images: [],
          message: 'Image generation skipped - API key not configured',
        },
      });
    }

    const prompts = [
      `Professional product photo of ${productMaster.name}. Product photography, studio lighting, white background, high quality, 8k`,
      `Lifestyle photo showing ${productMaster.name} in use. Lifestyle photography, realistic setting`,
      `Hero product image for ecommerce: ${productMaster.name}. Marketing photography, professional, clean background`,
    ];

    const generatedImages = [];

    for (let i = 0; i < prompts.length; i++) {
      try {
        const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-3-5-large/text-to-image', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompts[i],
            negative_prompt: 'blurry, low quality, distorted, ugly',
            aspect_ratio: '1:1',
            output_format: 'jpeg',
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error(`Image generation failed: ${response.status} ${errorData}`);
          continue;
        }

        const data = await response.json() as any;
        if (data.artifacts && data.artifacts[0]) {
          const imageBase64 = data.artifacts[0].base64;

          // Upload to Supabase Storage
          const fileName = `${productId}/${Date.now()}-generated-${i}.jpg`;
          const imageBuffer = Buffer.from(imageBase64, 'base64');

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
                image_url: urlData.publicUrl,
                storage_path: uploadData.path,
                image_type: 'generated',
                prompt: prompts[i],
              },
            ])
            .select()
            .single();

          if (imageData) {
            generatedImages.push(imageData);
          }
        }
      } catch (err) {
        console.error(`Error generating image ${i}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        images: generatedImages,
      },
    });
  } catch (error) {
    console.error('POST /api/images/generate error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Unknown error' },
      },
      { status: 500 }
    );
  }
}

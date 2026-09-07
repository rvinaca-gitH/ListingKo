import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const DEV_USER_ID = 'a1111111-1111-1111-1111-111111111111';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, platforms } = body;

    if (!productId || !platforms || platforms.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Missing productId or platforms' },
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

    if (productError || !product) throw new Error('Product not found');

    const { data: productMaster } = await supabaseAdmin
      .from('product_masters')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (!productMaster) throw new Error('Product master not found. Please analyze product first.');

    // Generate listings for each platform
    const createdListings = [];

    for (const platform of platforms) {
      const listing = generateListingForPlatform(
        platform,
        product,
        productMaster
      );

      // Insert listing directly (service role key bypasses RLS on local dev)
      try {
        console.log(`Creating listing for ${platform}...`);
        const { data: savedListing, error: insertError } = await supabaseAdmin
          .from('listings')
          .insert([listing])
          .select()
          .single();

        if (insertError) {
          console.error(`Error creating ${platform} listing:`, insertError);
          throw insertError;
        } else if (savedListing) {
          console.log(`Successfully created ${platform} listing`);
          createdListings.push(savedListing);
        } else {
          console.warn(`No data returned for ${platform} listing`);
        }
      } catch (err) {
        console.error(`Exception creating ${platform} listing:`, err);
        throw err;
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          items: createdListings,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/listings error:', error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('Final error:', errorMessage);
    return NextResponse.json(
      {
        success: false,
        error: { message: errorMessage, details: error },
      },
      { status: 500 }
    );
  }
}

function generateListingForPlatform(platform: string, product: any, productMaster: any) {
  const baseTitle = productMaster.name || product.title;
  const baseDescription = productMaster.description || product.description || '';

  const platformConfigs: Record<string, any> = {
    shopee: {
      title: `${baseTitle} | 100% Original | Fast Shipping`,
      description: `✨ Product Features:\n${productMaster.strengths.slice(0, 3).map((s: string) => `• ${s}`).join('\n')}\n\n📦 Specifications:\n${productMaster.target_customer}\n\n🚚 Free Shipping Available\n⭐ Trusted Seller`,
      toneKeywords: ['authentic', 'fast delivery', 'hot deal'],
    },
    lazada: {
      title: `${baseTitle} - Official Store`,
      description: `🎉 Special Offer!\n\nProduct Highlights:\n${productMaster.strengths.slice(0, 3).map((s: string) => `✓ ${s}`).join('\n')}\n\nPerfect for: ${productMaster.target_customer}\n\nWarranty Included | Easy Returns`,
      toneKeywords: ['official', 'warranty', 'authentic'],
    },
    tiktok: {
      title: `🔥 ${baseTitle} - Trending Now!`,
      description: `This ${productMaster.category} is PERFECT! \n\n✨ Why you need it:\n${productMaster.use_cases.slice(0, 2).map((u: string) => `💯 ${u}`).join('\n')}\n\n🎁 Limited Stock Available\n⚡ Get yours today!`,
      toneKeywords: ['trending', 'viral', 'must-have'],
    },
    facebook: {
      title: `Discover ${baseTitle}`,
      description: `${baseTitle} is here!\n\nWe're excited to introduce this premium ${productMaster.category} to our community.\n\n✨ Key Benefits:\n${productMaster.strengths.map((s: string) => `• ${s}`).join('\n')}\n\n👉 Shop now and get 10% off your first order!`,
      toneKeywords: ['community', 'family', 'quality'],
    },
  };

  const config = platformConfigs[platform] || platformConfigs.shopee;

  return {
    product_id: product.id,
    product_master_id: productMaster.id,
    user_id: DEV_USER_ID,
    platform,
    title: config.title,
    description: config.description,
    platform_data: {
      tone_keywords: config.toneKeywords,
      category: productMaster.category,
      seo_keywords: productMaster.keywords,
    },
    ai_version: 'v1-dev',
    status: 'DRAFT',
  };
}

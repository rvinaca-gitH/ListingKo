import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, ensurePublicUser } from '@/lib/auth';
import { encryptCredentials } from '@/lib/encryption';

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

const VALID_MARKETPLACES = ['shopee', 'lazada', 'tiktok', 'facebook'];

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request, supabaseAdmin);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('marketplace_connections')
    .select('id, marketplace, status, shop_id, shop_name, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: data || [] });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request, supabaseAdmin);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { marketplace, credentials, shopId, shopName } = body;

  if (!marketplace || !VALID_MARKETPLACES.includes(marketplace)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid marketplace' } },
      { status: 400 }
    );
  }

  await ensurePublicUser(supabaseAdmin, user);

  const { data: existing } = await supabaseAdmin
    .from('marketplace_connections')
    .select('id')
    .eq('user_id', user.id)
    .eq('marketplace', marketplace)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { success: false, error: { message: `${marketplace} is already connected` } },
      { status: 409 }
    );
  }

  const encrypted = encryptCredentials(credentials || {});

  const { data, error } = await supabaseAdmin
    .from('marketplace_connections')
    .insert({
      user_id: user.id,
      marketplace,
      credentials_encrypted: encrypted.encrypted,
      credentials_iv: `${encrypted.iv}:${encrypted.authTag}`,
      status: 'CONNECTED',
      shop_id: shopId,
      shop_name: shopName,
    })
    .select('id, marketplace, status, shop_id, shop_name, created_at, updated_at')
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}

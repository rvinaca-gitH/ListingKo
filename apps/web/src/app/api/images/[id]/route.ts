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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get image metadata
    const { data: image, error: getError } = await supabaseAdmin
      .from('images')
      .select('*')
      .eq('id', params.id)
      .single();

    if (getError || !image) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Image not found' },
        },
        { status: 404 }
      );
    }

    // Delete from storage
    if (image.storage_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('product-images')
        .remove([image.storage_path]);

      if (storageError) {
        console.error('Storage deletion failed:', storageError);
        // Continue anyway - still delete the record
      }
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('images')
      .delete()
      .eq('id', params.id);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      data: { message: 'Image deleted' },
    });
  } catch (error) {
    console.error(`DELETE /api/images/${params.id} error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error instanceof Error ? error.message : 'Unknown error' },
      },
      { status: 500 }
    );
  }
}

import { supabase } from '@/lib/database';

export interface ImageUploadInput {
  productId: string;
  userId: string;
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface ImageProcessingResult {
  imageId: string;
  urlOriginal: string;
  urlThumbnail?: string;
  urlMedium?: string;
  urlLarge?: string;
  width: number;
  height: number;
  sizeBytes: number;
}

/**
 * Get image dimensions from buffer
 * Note: In production, use a library like sharp
 */
function getImageDimensions(buffer: Buffer): { width: number; height: number } {
  // Parse JPEG/PNG headers to get dimensions
  // This is a simplified implementation
  // In production, use: const image = sharp(buffer); const metadata = await image.metadata();

  try {
    // Check for JPEG signature
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      // JPEG - simplified extraction (in production use sharp)
      return { width: 1200, height: 800 }; // Default for now
    }

    // Check for PNG signature
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      // PNG - simplified extraction (in production use sharp)
      return { width: 1200, height: 800 }; // Default for now
    }

    return { width: 1200, height: 800 }; // Default fallback
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    return { width: 1200, height: 800 };
  }
}

/**
 * Upload image to Supabase storage
 */
export async function uploadImage(input: ImageUploadInput): Promise<ImageProcessingResult> {
  try {
    const { productId, userId, buffer, filename, mimeType } = input;

    // Generate unique filename
    const timestamp = Date.now();
    const storagePath = `products/${userId}/${productId}/${timestamp}-${filename}`;

    // Upload to Supabase storage
    const uploadResult = await supabase.storage
      .from('product-images')
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadResult.error) {
      throw uploadResult.error;
    }

    // Get public URL
    const urlResult = supabase.storage
      .from('product-images')
      .getPublicUrl(storagePath);

    const urlOriginal = urlResult.data.publicUrl;

    // Get image dimensions
    const { width, height } = getImageDimensions(buffer);

    // Store image metadata in database
    const imageRecord = await supabase
      .from('images')
      .insert({
        product_id: productId,
        user_id: userId,
        url_original: urlOriginal,
        type: 'USER_UPLOAD',
        original_filename: filename,
        size_bytes: buffer.length,
        width,
        height,
        mime_type: mimeType,
      })
      .select()
      .single();

    if (imageRecord.error) {
      throw imageRecord.error;
    }

    return {
      imageId: imageRecord.data.id,
      urlOriginal,
      width,
      height,
      sizeBytes: buffer.length,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Delete image from storage and database
 */
export async function deleteImage(imageId: string, userId: string): Promise<void> {
  try {
    // Get image record
    const imageRecord = await supabase
      .from('images')
      .select('url_original')
      .eq('id', imageId)
      .eq('user_id', userId)
      .single();

    if (imageRecord.error) {
      throw imageRecord.error;
    }

    // Extract storage path from URL
    const urlOriginal = imageRecord.data.url_original;
    const match = urlOriginal.match(/product-images\/(.+)$/);
    if (match) {
      const storagePath = match[1];

      // Delete from storage
      await supabase.storage
        .from('product-images')
        .remove([storagePath]);
    }

    // Delete from database
    await supabase
      .from('images')
      .delete()
      .eq('id', imageId)
      .eq('user_id', userId);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

/**
 * List images for a product
 */
export async function listProductImages(productId: string, userId: string): Promise<any[]> {
  try {
    const images = await supabase
      .from('images')
      .select('*')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (images.error) {
      throw images.error;
    }

    return images.data || [];
  } catch (error) {
    console.error('Error listing images:', error);
    throw error;
  }
}

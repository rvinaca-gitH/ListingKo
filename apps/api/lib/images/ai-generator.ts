import { supabase } from '@/lib/database';
import { uploadImage } from './image-processor';

const STABILITY_API_URL = `${process.env.STABILITY_API_HOST || 'https://api.stability.ai'}/v2beta/stable-image/generate/core`;

export interface AIImageGenerationInput {
  productId: string;
  userId: string;
  productName: string;
  productDescription: string;
  imageType: 'hero' | 'lifestyle' | 'detail' | 'context';
}

export interface AIGeneratedImage {
  imageId: string;
  prompt: string;
  aiModel: string;
  aiVersion: string;
  imageType: string;
  urlOriginal: string;
}

/**
 * Generate product description for AI image prompt
 */
function generateImagePrompt(input: AIImageGenerationInput): string {
  const typePrompts = {
    hero: `Create a professional product hero image for ${input.productName}. ${input.productDescription} The image should be high-quality, well-lit, centered, and suitable for product listings on ecommerce platforms.`,
    lifestyle: `Create a lifestyle image showing ${input.productName} in use. ${input.productDescription} The image should show the product in a real-world setting that appeals to potential customers.`,
    detail: `Create a detailed close-up image of ${input.productName}. ${input.productDescription} Focus on the product's features, texture, and quality. High resolution and professional lighting.`,
    context: `Create a contextual image showing ${input.productName} in an appropriate environment. ${input.productDescription} The image should help customers understand how to use or apply the product.`,
  };

  return typePrompts[input.imageType] || typePrompts.hero;
}

/**
 * Generate an image through Stability AI and persist the returned asset.
 */
export async function generateAIImage(input: AIImageGenerationInput): Promise<AIGeneratedImage> {
  try {
    const prompt = generateImagePrompt(input);

    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) {
      throw new Error('STABILITY_API_KEY is not configured');
    }

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('output_format', 'png');
    formData.append('aspect_ratio', '3:2');

    const response = await fetch(STABILITY_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'image/*',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Stability image generation failed with status ${response.status}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const uploadedImage = await uploadImage({
      productId: input.productId,
      userId: input.userId,
      buffer: imageBuffer,
      filename: `ai-${input.imageType}-${Date.now()}.png`,
      mimeType: 'image/png',
    });

    const imageRecord = await supabase
      .from('images')
      .update({
        type: 'AI_GENERATED',
        ai_prompt: prompt,
        ai_version: 'stable-image-core',
        ai_model: 'stability-ai',
        purposes: [input.imageType],
      })
      .eq('id', uploadedImage.imageId)
      .eq('user_id', input.userId)
      .select()
      .single();

    if (imageRecord.error) {
      throw imageRecord.error;
    }

    return {
      imageId: imageRecord.data.id,
      prompt,
      aiModel: 'stability-ai',
      aiVersion: 'stable-image-core',
      imageType: input.imageType,
      urlOriginal: imageRecord.data.url_original,
    };
  } catch (error) {
    console.error('Error generating AI image:', error);
    throw error;
  }
}

/**
 * Generate multiple variations of product images
 */
export async function generateImageVariations(
  productId: string,
  userId: string,
  productName: string,
  productDescription: string
): Promise<AIGeneratedImage[]> {
  const imageTypes: Array<'hero' | 'lifestyle' | 'detail' | 'context'> = [
    'hero',
    'lifestyle',
    'detail',
    'context',
  ];

  const results: AIGeneratedImage[] = [];

  for (const imageType of imageTypes) {
    try {
      const result = await generateAIImage({
        productId,
        userId,
        productName,
        productDescription,
        imageType,
      });
      results.push(result);
    } catch (error) {
      console.error(`Error generating ${imageType} image:`, error);
      // Continue with other image types even if one fails
    }
  }

  return results;
}

/**
 * Analyze uploaded image with Claude Vision
 */
export async function analyzeProductImage(imageUrl: string, productContext: string): Promise<string> {
  try {
    throw new Error(`Image analysis is not configured for ${imageUrl} and product context ${productContext}`);
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

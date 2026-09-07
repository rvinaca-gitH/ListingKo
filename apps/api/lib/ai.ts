import { ProductMaster } from '@listingko/shared-types';

const ANTHROPIC_API_KEY: string = process.env.ANTHROPIC_API_KEY || '';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

if (!ANTHROPIC_API_KEY) {
  throw new Error('Missing ANTHROPIC_API_KEY environment variable');
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ContentBlock {
  type: string;
  text?: string;
}

interface ApiMessage {
  content: ContentBlock[];
}

/**
 * Call Anthropic Claude API
 */
async function callClaude(
  messages: Message[],
  maxTokens: number = 1024
): Promise<string> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-1-20250805',
      max_tokens: maxTokens,
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as ApiMessage;
  const textContent = data.content.find((block) => block.type === 'text');
  if (!textContent || !textContent.text) {
    throw new Error('No text content in Claude response');
  }

  return textContent.text;
}

/**
 * Analyze a product and create Product Master
 */
export async function analyzeProduct(
  productTitle: string,
  productDescription: string,
  category?: string
): Promise<ProductMaster> {
  const analysisPrompt = `Analyze this ecommerce product and create a comprehensive product master.

Product Title: ${productTitle}
Product Description: ${productDescription}
${category ? `Category: ${category}` : ''}

Provide a JSON response with this exact structure (no markdown):
{
  "name": "product name",
  "description": "detailed description",
  "category": "category",
  "sku": "UPPERCASE-SKU-123",
  "strengths": ["strength 1", "strength 2", "strength 3", "strength 4", "strength 5"],
  "targetCustomer": "target customer description",
  "useCases": ["use case 1", "use case 2", "use case 3"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "seoScore": 85,
  "confidenceScore": 0.95,
  "specifications": {"key": "value"},
  "unsupportedClaims": ["claim to avoid"]
}`;

  const response = await callClaude([{ role: 'user', content: analysisPrompt }], 1500);

  try {
    const parsed = JSON.parse(response);
    return parsed as ProductMaster;
  } catch {
    console.error('Failed to parse Claude response:', response);
    throw new Error('Failed to parse product analysis response');
  }
}

/**
 * Generate platform-specific listing
 */
export async function generateListing(
  productMaster: ProductMaster,
  platform: 'shopee' | 'lazada' | 'tiktok' | 'facebook'
): Promise<{ title: string; description: string; platformData?: Record<string, unknown> }> {
  const platformGuidelines = {
    shopee: `Format for Shopee Singapore:
- Title: Max 200 characters, include main keyword
- Description: Up to 3000 characters
- Include price points if known
- Use Shopee-friendly formatting (bullet points)`,

    lazada: `Format for Lazada:
- Title: Max 160 characters, keyword-rich
- Description: Up to 2000 characters
- Structure: Features | Benefits | Specifications
- Include warranty/return info if applicable`,

    tiktok: `Format for TikTok Shop:
- Title: 30-100 characters, catchy
- Description: 500-1000 characters, conversational tone
- Use trending hashtags (3-5)
- Include call-to-action
- Emojis encouraged`,

    facebook: `Format for Facebook Marketplace:
- Title: 80-120 characters, clear and specific
- Description: 100-500 characters, conversational
- Include condition (new/used)
- Emphasize key benefits
- Clear pricing statement`,
  };

  const generationPrompt = `Generate a ${platform} listing for this product:

Product Master:
${JSON.stringify(productMaster, null, 2)}

${platformGuidelines[platform]}

Respond with JSON (no markdown):
{
  "title": "listing title",
  "description": "listing description",
  "platformData": {}
}`;

  const response = await callClaude([{ role: 'user', content: generationPrompt }], 2000);

  try {
    const parsed = JSON.parse(response);
    return parsed;
  } catch {
    console.error('Failed to parse listing response:', response);
    throw new Error('Failed to generate listing');
  }
}

/**
 * Score a listing with QA
 */
export async function scoreListingQA(
  listing: { title: string; description: string },
  productMaster: ProductMaster,
  platform: string
): Promise<{
  factAccuracy: number;
  seoQuality: number;
  platformFit: number;
  readability: number;
  claimSafety: number;
  issues?: Record<string, string[]>;
}> {
  const scoringPrompt = `Score this ${platform} listing against the product master.

Listing:
Title: ${listing.title}
Description: ${listing.description}

Product Master:
${JSON.stringify(productMaster, null, 2)}

Score each dimension 0-100:
1. Fact Accuracy: Does listing match product master facts?
2. SEO Quality: Keywords, structure, searchability
3. Platform Fit: Follows ${platform} best practices
4. Readability: Clarity, grammar, formatting
5. Claim Safety: No unsupported or risky claims

Respond with JSON (no markdown):
{
  "factAccuracy": 90,
  "seoQuality": 85,
  "platformFit": 88,
  "readability": 92,
  "claimSafety": 95,
  "issues": {
    "factAccuracy": [],
    "seoQuality": ["issue 1"],
    "platformFit": [],
    "readability": [],
    "claimSafety": []
  }
}`;

  const response = await callClaude([{ role: 'user', content: scoringPrompt }], 1500);

  try {
    const parsed = JSON.parse(response);
    return parsed;
  } catch {
    console.error('Failed to parse QA score response:', response);
    throw new Error('Failed to score listing');
  }
}

/**
 * Auto-repair a listing that failed QA
 */
export async function repairListing(
  listing: { title: string; description: string },
  productMaster: ProductMaster,
  platform: string,
  issues: Record<string, string[]>
): Promise<{ title: string; description: string }> {
  const repairPrompt = `Fix this ${platform} listing based on QA issues.

Current Listing:
Title: ${listing.title}
Description: ${listing.description}

Product Master:
${JSON.stringify(productMaster, null, 2)}

Issues to Fix:
${JSON.stringify(issues, null, 2)}

Generate an improved listing that addresses all issues.

Respond with JSON (no markdown):
{
  "title": "improved title",
  "description": "improved description"
}`;

  const response = await callClaude([{ role: 'user', content: repairPrompt }], 2000);

  try {
    const parsed = JSON.parse(response);
    return { title: parsed.title, description: parsed.description };
  } catch {
    console.error('Failed to parse repair response:', response);
    throw new Error('Failed to repair listing');
  }
}

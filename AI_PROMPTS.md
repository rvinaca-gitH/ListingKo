# ListingKo — AI Prompts & Workflows

> Versioned AI prompts, evaluation cases, and workflow documentation.

---

## 1. Prompt Versioning Strategy

Each prompt follows this format:

```
{PROMPT_NAME}_V{N}
```

Example:
- `PRODUCT_ANALYSIS_V1` (current stable)
- `PRODUCT_ANALYSIS_V2` (next iteration)

### Version Bumping Rules

- **V → V+1:** Breaking changes to output schema or instructions
- **V (patch):** Improvements to wording, examples, or quality (no schema change)

### Evaluation Cases

Every prompt must have:
1. **Happy path:** Valid input, expected output
2. **Edge cases:** Ambiguous input, missing data
3. **Failure modes:** What should the AI refuse?

---

## 2. Product Analysis Pipeline

### PRODUCT_ANALYSIS_V1

Analyzes product photos + text to create structured Product Master.

**Input:**
- Product photos (base64 images)
- Product name (optional)
- Product description (optional)
- Category (optional)

**Output Schema:**

```json
{
  "name": "string (50-200 chars)",
  "description": "string (100-500 chars)",
  "category": "string",
  "sku": "string (uppercase, alphanumeric + dash)",
  "strengths": ["string", "string", "string", "string", "string"],
  "targetCustomer": "string",
  "useCases": ["string", "string", "string"],
  "keywords": ["string", "string", "string", "string", "string"],
  "specifications": {
    "material": "string",
    "color": "string",
    "dimensions": "string",
    "weight": "string"
  },
  "unsupportedClaims": ["string"],
  "confidenceScore": 0.0-1.0,
  "missingInformation": ["string"]
}
```

**Prompt:**

```
You are an ecommerce product analyst. Your job is to analyze product photos and descriptions to create a comprehensive product master that will be used to generate marketplace listings.

IMPORTANT RULES:
1. Never invent product specifications. Only extract what you can see or infer from the image.
2. If information is missing, list it in "missingInformation" — do NOT guess.
3. Flag any unsupported claims (medical, guaranteed to work, etc.) that would violate marketplace policies.
4. SKU must be uppercase, alphanumeric, and may contain dashes. Example: WBH-001, HDMI-CABLE-2M
5. Confidence score should reflect how certain you are about this product analysis.

ANALYSIS PROCESS:
Step 1: Examine the photos carefully
  - What is the product?
  - What are its obvious features?
  - What condition is it in?

Step 2: Extract key information
  - Name (concise, descriptive)
  - Description (clear benefit-focused)
  - Strengths (top 5 selling points)
  - Target customer (who would buy this?)

Step 3: Identify specifications
  - Material/composition
  - Color/appearance
  - Dimensions/size
  - Weight
  - Any other relevant specs visible

Step 4: SEO optimization
  - Generate 5 keywords people would search for
  - Think about use cases and benefits

Step 5: Safety check
  - Are there any claims that shouldn't be made?
  - Any missing information that's critical?

Respond in valid JSON format only. No additional text.

Product photo(s): [images will be provided]
Product name: ${productName || '(not provided)'}
Product description: ${productDescription || '(not provided)'}
Category: ${category || '(not provided)'}
```

**Evaluation Cases:**

```json
[
  {
    "name": "Happy Path - Bluetooth Headphones",
    "input": {
      "images": ["headphones.jpg"],
      "name": "Wireless Headphones",
      "description": "Comfortable over-ear headphones with noise cancellation",
      "category": "ELECTRONICS"
    },
    "expectedOutput": {
      "name": "Wireless Bluetooth Headphones",
      "strengths": ["Noise cancellation", "Long battery life", "Comfortable fit"],
      "targetCustomer": "Remote workers and music enthusiasts",
      "confidenceScore": ">0.85"
    }
  },
  {
    "name": "Edge Case - Limited Product Photo",
    "input": {
      "images": ["blurry.jpg"],
      "name": null,
      "description": null
    },
    "expectedOutput": {
      "confidenceScore": "<0.60",
      "missingInformation": ["Product name", "Accurate description", "Dimensions"]
    }
  },
  {
    "name": "Failure Mode - Medical Claims",
    "input": {
      "images": ["supplement.jpg"],
      "description": "Guaranteed to cure diabetes"
    },
    "expectedOutput": {
      "unsupportedClaims": ["Guaranteed to cure diabetes"]
    }
  }
]
```

---

## 3. Content Generation Pipeline

### LISTING_GENERATION_SHOPEE_V1

Generates Shopee-specific listing from Product Master.

**Input:**
- ProductMaster (complete structured product data)
- Platform: 'shopee'

**Output Schema:**

```json
{
  "title": "string (max 60 chars)",
  "description": "string (max 3000 chars, with formatting)",
  "category": "string (Shopee category code)",
  "tags": ["string", "string", "string"],
  "attributes": {
    "brand": "string",
    "condition": "NEW" | "USED",
    "material": "string"
  },
  "highlights": ["string", "string", "string"]
}
```

**Prompt:**

```
You are a Shopee marketplace expert copywriter. Your task is to create a compelling Shopee listing from a product master.

SHOPEE RULES:
1. Title: Max 60 characters. Must include key keyword + benefit.
2. Description: Up to 3000 characters. Use formatting: \n for line breaks, **bold** for emphasis.
3. Category: Use provided Shopee category codes.
4. Tags: 3-5 searchable tags that buyers would use.
5. Attributes: Fill with provided specifications.
6. Highlights: Top 3 reasons to buy this product.

TONE:
- Professional but friendly
- Benefit-focused (not feature-focused)
- Builds trust
- Urgency where appropriate
- Clear CTA

STRUCTURE:
```
**Product Overview**
Brief compelling hook about what this product does.

**Key Features**
• Feature 1
• Feature 2
• Feature 3

**Who is this for?**
[Target customer]

**Use Cases**
[Top use cases]

**Specifications**
[Key specs]

**Why Buy From Us?**
[Differentiators]
```

RULES TO FOLLOW:
1. Never make unsupported claims
2. Shopee buyers are often price-sensitive — emphasize value
3. Include keywords naturally (don't stuff)
4. Be specific about measurements, materials, colors
5. Mention warranty if available

Product Master: ${productMaster}
Marketplace: Shopee
```

**Evaluation Cases:**

See below for platform-specific testing

### LISTING_GENERATION_LAZADA_V1

Similar to Shopee but optimized for Lazada's algorithm.

**Key Differences:**
- Title: Max 255 chars (more room)
- Description: Supports HTML-like formatting
- Attribute requirements differ (category path, attributes)
- Lazada prioritizes product specifications sheet

### LISTING_GENERATION_TIKTOK_V1

Optimized for TikTok Shop's short-form, viral angle.

**Output Schema:**

```json
{
  "title": "string (max 40 chars, catchy)",
  "description": "string (max 500 chars, conversational)",
  "hook": "string (first 2 sentences, must grab attention)",
  "hashtags": ["string", "string", "string"]
}
```

**Prompt Emphasis:**
- Hook is critical (viral potential)
- Conversational tone (less "salesy")
- Use trending language
- Emphasize lifestyle/emotion over specs
- FOMO-friendly ("only X left", "trending now")

### LISTING_GENERATION_FACEBOOK_V1

Optimized for Facebook Page posts.

**Output Schema:**

```json
{
  "postCopy": "string (conversational, 2-3 short paragraphs)",
  "adCopy": "string (punchy, benefit-focused, max 125 chars)",
  "hashtags": ["string", "string", "string"],
  "cta": "string (call-to-action: Shop Now, Learn More, etc.)"
}
```

---

## 4. QA Scoring Pipeline

### QA_SCORE_V1

Scores generated listing against quality criteria.

**Input:**
- Listing (title, description, platform_data)
- ProductMaster (for fact-checking)

**Output Schema:**

```json
{
  "factAccuracy": 0-100,
  "seoQuality": 0-100,
  "platformFit": 0-100,
  "readability": 0-100,
  "claimSafety": 0-100,
  "totalScore": 0-100,
  "passed": true | false,
  "issues": {
    "factAccuracy": ["issue1", "issue2"],
    "seoQuality": ["issue1"],
    "platformFit": ["issue1"],
    "readability": [],
    "claimSafety": ["issue1"]
  }
}
```

**Prompt:**

```
You are a marketplace listing QA expert. Your job is to score a generated listing against quality criteria.

SCORING CRITERIA:

1. **Fact Accuracy (0-100)**
   - Are all claims supported by the Product Master?
   - Are there any invented specifications?
   - Are features accurately described?
   Score 100 if: All facts match product master, no unsupported claims
   Score <50 if: Multiple invented facts or contradictions

2. **SEO Quality (0-100)**
   - Are primary keywords included naturally?
   - Is the title keyword-optimized?
   - Are there semantic variations of key terms?
   - Good use of long-tail keywords?
   Score 100 if: Well-optimized for search, keywords feel natural
   Score <50 if: No keywords or keyword stuffing

3. **Platform Fit (0-100)**
   - Does it meet platform requirements?
   - Is the format/structure correct for the platform?
   - Are platform-specific attributes included?
   - Character limits respected?
   Score 100 if: Perfectly formatted for platform
   Score <50 if: Violates platform rules or requirements

4. **Readability (0-100)**
   - Is the text clear and scannable?
   - Good use of formatting (bullets, line breaks)?
   - Appropriate tone for the platform?
   - No grammatical errors?
   Score 100 if: Easy to read, well-formatted, error-free
   Score <50 if: Hard to read, confusing structure, many errors

5. **Claim Safety (0-100)**
   - No unsupported health claims?
   - No guaranteed/certainty claims?
   - No discriminatory language?
   - Compliant with marketplace policies?
   Score 100 if: All claims are safe and policy-compliant
   Score <50 if: Multiple policy violations or risky claims

PASS/FAIL THRESHOLD:
- Total Score ≥ 85: PASS
- Total Score < 85: FAIL (needs repair)

Listing:
${listing}

Product Master:
${productMaster}

Respond in JSON format only.
```

---

## 5. Auto-Repair Pipeline

### REPAIR_LISTING_V1

Attempts to fix a failed listing based on QA issues.

**Input:**
- Failing Listing
- QA Issues (from QA_SCORE)
- ProductMaster (source of truth)

**Output:**
- Repaired Listing (same schema as original)

**Prompt:**

```
You are an ecommerce listing repair expert. Your task is to fix issues in a listing while staying true to the Product Master.

REPAIR RULES:
1. Only use information from the Product Master — never invent new facts
2. Do not remove critical product information
3. Maintain the listing's tone and structure where possible
4. Fix issues one at a time

ISSUES TO FIX:
${issues}

HOW TO FIX EACH CATEGORY:

**Fact Accuracy Issues:**
- Remove any claims not supported by Product Master
- Replace vague descriptions with concrete product details
- Cross-reference all specifications

**SEO Quality Issues:**
- Naturally incorporate primary keywords (2-3 times in title + description)
- Add semantic variations and related terms
- Optimize title for search intent

**Platform Fit Issues:**
- Ensure all required fields are filled
- Respect character limits exactly
- Use platform-specific formatting

**Readability Issues:**
- Add bullet points for features
- Break long paragraphs into shorter ones
- Use clear, simple language
- Fix any grammatical errors

**Claim Safety Issues:**
- Remove all unsupported claims
- Replace "guaranteed" with "designed to"
- Remove health/medical claims
- Add disclaimer if needed

Current Listing:
${listing}

Product Master:
${productMaster}

Repaired Listing (same JSON schema):
```

---

## 6. Image Generation Pipeline

### IMAGE_GENERATION_V1

Generates AI product images from Product Master + reference images.

**Input:**
- ProductMaster
- Original product photos (for reference)
- Image type requested (hero, feature, lifestyle, social, specification)

**Output:**
- Image prompt + generation parameters

**Prompt (used internally for image generation):**

```
Generate a professional product image for the following:

PRODUCT: ${productName}
DESCRIPTION: ${productDescription}
PURPOSE: ${imageType} image

STYLE GUIDE:
- Photography style: Professional, clean, bright lighting
- Background: ${imageType === 'hero' ? 'White or light neutral' : 'Context-appropriate'}
- Composition: ${imageType === 'social' ? 'Square (1:1), vibrant' : 'Centered, balanced'}

REQUIREMENTS:
- Do NOT alter the product's actual appearance
- Show the product clearly and prominently
- Lighting: Professional, even, no harsh shadows
- Color accuracy: Match reference images

REFERENCE IMAGES: [original photos provided]

Generate high-quality image as described above.
```

---

## 7. Prompt Quality Checklist

Before deploying a new prompt version:

- [ ] Clear input/output schema documented
- [ ] Examples of each output format provided
- [ ] At least 3 evaluation cases (happy path, edge case, failure mode)
- [ ] Tested with various product categories
- [ ] Tested with incomplete/ambiguous input
- [ ] Tested with boundary conditions (max/min lengths)
- [ ] Checked for prompt injection vulnerabilities
- [ ] Validated output schema compliance
- [ ] Measured quality vs. previous version
- [ ] Cost comparison (token usage)
- [ ] Documented any limitations

---

## 8. A/B Testing Framework

To compare prompt versions:

```json
{
  "test_id": "prompt_v1_vs_v2",
  "prompt_v1": "PRODUCT_ANALYSIS_V1",
  "prompt_v2": "PRODUCT_ANALYSIS_V2",
  "sample_size": 100,
  "metrics": {
    "output_quality": {
      "v1": 0.82,
      "v2": 0.89,
      "winner": "v2"
    },
    "token_usage": {
      "v1": 450,
      "v2": 520,
      "efficiency": "v1 is 15% cheaper"
    },
    "latency": {
      "v1": 3.2,
      "v2": 3.5,
      "difference": "v2 is 300ms slower"
    }
  },
  "decision": "Use V2 (better quality, acceptable cost increase)"
}
```

---

## 9. Error Handling in Prompts

### Graceful Degradation

If the AI cannot complete a task, it should:

1. **Return what it can** with confidence scores
2. **Flag uncertainty** in `missingInformation` or `issues`
3. **Never guess** at critical product facts
4. **Suggest next steps** for the user

Example:

```json
{
  "name": "Wireless Headphones (assumed)",
  "description": "Over-ear audio device with connectivity features",
  "confidenceScore": 0.45,
  "missingInformation": [
    "Exact brand/model",
    "Battery specifications",
    "Frequency response range",
    "Cable included",
    "Warranty information"
  ]
}
```

---

## 10. Cost Optimization

### Model Selection by Task

| Task | Recommended Model | Rationale |
|------|-------------------|-----------|
| Product Analysis | claude-3-5-sonnet | Vision + reasoning needed |
| Listing Generation | claude-3-5-sonnet | Quality matters, good cost/quality balance |
| QA Scoring | claude-3-5-sonnet | Nuanced judgment required |
| Auto-Repair | claude-3-5-sonnet | Context + reasoning |
| Image Generation | DALL-E 3 | Specialized image synthesis |

### Cost Tracking

```typescript
// Track cost per feature
const costs = {
  productAnalysis: 0.00300,  // per product
  listingGeneration: 0.00150, // per listing
  qaScoring: 0.00100,        // per scoring
  autoRepair: 0.00150,       // per repair
  imageGeneration: 0.04000,  // per image (external service)
};

// Free tier limit: $5/month
const freeTierMonthlyLimit = 5.00;
const estimatedFreeListings = Math.floor(freeTierMonthlyLimit / (
  costs.productAnalysis +
  (4 * costs.listingGeneration) + // Avg 4 platforms
  (4 * costs.qaScoring) +
  (8 * costs.imageGeneration) // Avg 8 images
));
// ≈ ~15 products before hitting cost limit
```

---

## 11. Monitoring & Metrics

Track for each prompt:

```typescript
{
  "prompt_name": "LISTING_GENERATION_SHOPEE_V1",
  "metrics": {
    "usage_count": 1250,
    "avg_tokens_input": 850,
    "avg_tokens_output": 320,
    "avg_cost": 0.00145,
    "avg_latency_ms": 2840,
    "error_rate": 0.02,
    "schema_compliance": 0.98,
    "qa_score_distribution": {
      "0-20": 0.01,
      "21-40": 0.03,
      "41-60": 0.08,
      "61-80": 0.35,
      "81-100": 0.53
    }
  }
}
```

---

## 12. Prompt Evolution

Document decisions:

```markdown
### PRODUCT_ANALYSIS_V1 → V2

**Date:** 2024-09-15
**Reason:** V1 was inventing specifications not visible in photos

**Changes:**
- Rewrote confidence score logic
- Added explicit "only extract what you see" rule
- Separated specifications into "visible" vs "inferred"
- Added more evaluation cases around ambiguous products

**Results:**
- False positive specifications: 12% → 2%
- Confidence score accuracy: +15%
- Token usage: +5%
- Latency: +200ms

**Rollout:** 10% canary for 1 week, then full rollout
```

---


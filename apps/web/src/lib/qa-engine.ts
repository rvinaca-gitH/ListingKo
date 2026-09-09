// Rule-based QA scoring and auto-repair for generated listings.
// No AI call involved - deterministic checks per CLAUDE.md section 10.
// These platform limits are internal quality heuristics, not scraped from
// live marketplace docs - treat as conservative defaults, not verified facts.

export interface QAProductMaster {
  name: string;
  description: string;
  category: string;
  strengths: string[];
  keywords: string[];
  specifications?: Record<string, unknown> | null;
  unsupported_claims?: string[] | null;
}

export interface QAListingContent {
  platform: string;
  title: string;
  description: string;
}

export interface QAScore {
  fact_accuracy: number;
  seo_quality: number;
  platform_fit: number;
  readability: number;
  claim_safety: number;
  total_score: number;
  passed: boolean;
  issues: Record<string, string[]>;
}

export const QA_PASS_THRESHOLD = 85;

const PLATFORM_LIMITS: Record<string, { titleMax: number; descriptionMax: number; descriptionMin: number }> = {
  shopee: { titleMax: 120, descriptionMax: 3000, descriptionMin: 80 },
  lazada: { titleMax: 255, descriptionMax: 3000, descriptionMin: 80 },
  tiktok: { titleMax: 255, descriptionMax: 2000, descriptionMin: 50 },
  facebook: { titleMax: 100, descriptionMax: 2000, descriptionMin: 50 },
};

// High-risk unsupported claim phrases per CLAUDE.md section 6 (medical,
// certification, guarantee, and performance claims AI must not invent).
const RISKY_CLAIM_PHRASES = [
  'fda approved', 'clinically proven', 'doctor recommended', 'cures',
  'guaranteed to', '100% guaranteed', 'no side effects', 'medically tested',
  'certified organic', 'lifetime warranty', 'money back guarantee',
  'scientifically proven', 'eliminates', 'permanently removes', 'anti-cancer',
  'fda-approved', 'clinically-proven',
];

const CTA_PHRASES = ['buy now', 'shop now', 'order today', 'order now', 'get yours', 'add to cart', 'limited stock', 'shop today'];

const SPEC_NUMBER_PATTERN = /\b\d+(\.\d+)?\s?(mah|gb|tb|mb|kg|g|cm|mm|inch|in|hour|hr|hrs|watt|w|ml|l|oz|lb|volt|v)\b/gi;

function normalize(text: string): string {
  return text.toLowerCase();
}

export function scoreListing(listing: QAListingContent, master: QAProductMaster): QAScore {
  const issues: Record<string, string[]> = {};
  const fullText = `${listing.title} ${listing.description}`;
  const fullTextLower = normalize(fullText);

  // --- platform_fit ---
  let platform_fit = 100;
  const limits = PLATFORM_LIMITS[listing.platform] || PLATFORM_LIMITS.shopee;
  const platformIssues: string[] = [];
  if (listing.title.length > limits.titleMax) {
    platform_fit -= 40;
    platformIssues.push(`Title exceeds recommended ${limits.titleMax} characters for ${listing.platform} (${listing.title.length} chars)`);
  }
  if (listing.description.length > limits.descriptionMax) {
    platform_fit -= 30;
    platformIssues.push(`Description exceeds recommended ${limits.descriptionMax} characters for ${listing.platform} (${listing.description.length} chars)`);
  }
  if (listing.description.length < limits.descriptionMin) {
    platform_fit -= 20;
    platformIssues.push(`Description is shorter than recommended ${limits.descriptionMin} characters (${listing.description.length} chars)`);
  }
  platform_fit = Math.max(0, platform_fit);
  if (platformIssues.length) issues.platform_fit = platformIssues;

  // --- claim_safety ---
  let claim_safety = 100;
  const claimIssues: string[] = [];
  for (const phrase of RISKY_CLAIM_PHRASES) {
    if (fullTextLower.includes(phrase)) {
      claim_safety -= 15;
      claimIssues.push(`Contains unverified claim phrase: "${phrase}"`);
    }
  }
  for (const claim of master.unsupported_claims || []) {
    if (claim && fullTextLower.includes(normalize(claim))) {
      claim_safety -= 20;
      claimIssues.push(`Contains known unsupported claim: "${claim}"`);
    }
  }
  claim_safety = Math.max(0, claim_safety);
  if (claimIssues.length) issues.claim_safety = claimIssues;

  // --- fact_accuracy ---
  let fact_accuracy = 100;
  const factIssues: string[] = [];
  const knownFactsText = normalize(`${master.description} ${JSON.stringify(master.specifications || {})}`);
  const specMatches = fullText.match(SPEC_NUMBER_PATTERN) || [];
  for (const spec of specMatches) {
    if (!knownFactsText.includes(normalize(spec.trim()))) {
      fact_accuracy -= 25;
      factIssues.push(`Mentions a spec not found in Product Master: "${spec.trim()}"`);
    }
  }
  const nameFirstWord = master.name?.split(' ')[0]?.toLowerCase();
  if (nameFirstWord && !normalize(listing.title).includes(nameFirstWord)) {
    fact_accuracy -= 10;
    factIssues.push(`Title does not reference the product name "${master.name}"`);
  }
  fact_accuracy = Math.max(0, fact_accuracy);
  if (factIssues.length) issues.fact_accuracy = factIssues;

  // --- seo_quality ---
  let seo_quality = 100;
  const seoIssues: string[] = [];
  const keywords = master.keywords || [];
  if (keywords.length > 0) {
    const matched = keywords.filter((k) => fullTextLower.includes(normalize(k)));
    seo_quality = Math.round((matched.length / keywords.length) * 100);
    const missing = keywords.filter((k) => !matched.includes(k));
    if (missing.length) {
      seoIssues.push(`Missing target keywords: ${missing.join(', ')}`);
    }
  }
  if (seoIssues.length) issues.seo_quality = seoIssues;

  // --- readability ---
  let readability = 100;
  const readabilityIssues: string[] = [];
  const sentences = listing.description.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const words = listing.description.split(/\s+/).filter(Boolean);
  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
  if (avgWordsPerSentence > 28) {
    readability -= 25;
    readabilityIssues.push(`Sentences are too long on average (${Math.round(avgWordsPerSentence)} words/sentence) - hard to skim`);
  }
  const hasCTA = CTA_PHRASES.some((cta) => fullTextLower.includes(cta));
  if (!hasCTA) {
    readability -= 15;
    readabilityIssues.push('No clear call-to-action found (e.g. "Shop now", "Order today")');
  }
  readability = Math.max(0, readability);
  if (readabilityIssues.length) issues.readability = readabilityIssues;

  const total_score = Math.round(
    (fact_accuracy + seo_quality + platform_fit + readability + claim_safety) / 5
  );

  return {
    fact_accuracy,
    seo_quality,
    platform_fit,
    readability,
    claim_safety,
    total_score,
    passed: total_score >= QA_PASS_THRESHOLD,
    issues,
  };
}

export function repairListing(
  listing: QAListingContent,
  master: QAProductMaster,
  issues: Record<string, string[]>
): QAListingContent {
  let title = listing.title;
  let description = listing.description;
  const limits = PLATFORM_LIMITS[listing.platform] || PLATFORM_LIMITS.shopee;

  // Strip risky claim phrases and known unsupported claims (grounded fix:
  // removing unverifiable text, never inventing replacement facts).
  if (issues.claim_safety) {
    const phrasesToStrip = [...RISKY_CLAIM_PHRASES, ...(master.unsupported_claims || [])];
    for (const phrase of phrasesToStrip) {
      const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      title = title.replace(re, '').replace(/\s{2,}/g, ' ').trim();
      description = description.replace(re, '').replace(/\s{2,}/g, ' ').trim();
    }
  }

  // Remove sentences containing invented specs not grounded in Product Master
  // (can't verify them, so strip rather than guess a correction).
  if (issues.fact_accuracy) {
    const invented = issues.fact_accuracy
      .map((i) => i.match(/not found in Product Master: "(.+)"/)?.[1])
      .filter((v): v is string => Boolean(v));
    for (const spec of invented) {
      const sentences = description.split(/(?<=[.!?])\s+/);
      description = sentences
        .filter((s) => !normalize(s).includes(normalize(spec)))
        .join(' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
    }
  }

  // Truncate over-limit fields.
  if (title.length > limits.titleMax) {
    title = title.slice(0, limits.titleMax - 3).trim() + '...';
  }
  if (description.length > limits.descriptionMax) {
    description = description.slice(0, limits.descriptionMax - 3).trim() + '...';
  }

  // Description too thin: append verified strengths (grounded in Product Master).
  if (issues.platform_fit?.some((i) => i.includes('shorter than recommended')) && master.strengths?.length) {
    const strengthsBlock = master.strengths.map((s) => `- ${s}`).join('\n');
    description = `${description}\n\n${strengthsBlock}`.trim();
  }

  // Inject missing SEO keywords naturally (grounded - keywords already exist
  // in Product Master, not invented here).
  if (issues.seo_quality && master.keywords?.length) {
    const fullTextLower = normalize(`${title} ${description}`);
    const missing = master.keywords.filter((k) => !fullTextLower.includes(normalize(k)));
    if (missing.length) {
      description = `${description}\n\nKeywords: ${missing.join(', ')}`.trim();
    }
  }

  // Add a call-to-action if missing.
  if (issues.readability?.some((i) => i.includes('call-to-action'))) {
    description = `${description}\n\nShop now and experience the difference!`.trim();
  }

  // Re-clamp length after additions, in case repairs pushed it back over.
  if (description.length > limits.descriptionMax) {
    description = description.slice(0, limits.descriptionMax - 3).trim() + '...';
  }

  return { platform: listing.platform, title, description };
}

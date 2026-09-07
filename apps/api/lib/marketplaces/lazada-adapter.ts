import { Listing } from '@listingko/shared-types';
import { MarketplaceAdapter, MarketplaceConfig, MarketplaceCredentials, PublishResult } from './base-adapter';

const LAZADA_CONFIG: MarketplaceConfig = {
  clientId: process.env.LAZADA_CLIENT_ID || '',
  clientSecret: process.env.LAZADA_CLIENT_SECRET || '',
  redirectUri: process.env.LAZADA_REDIRECT_URI || 'http://localhost:3000/api/oauth/lazada/callback',
  authorizationUrl: 'https://auth.lazada.com/oauth/authorize',
  tokenUrl: 'https://auth.lazada.com/oauth/token',
  apiBaseUrl: 'https://api.lazada.sg/rest/api',
};

export class LazadaAdapter extends MarketplaceAdapter {
  constructor(credentials: MarketplaceCredentials) {
    super('lazada', LAZADA_CONFIG, credentials);
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      state,
    });
    return `${this.config.authorizationUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<MarketplaceCredentials> {
    throw new Error(`Lazada OAuth exchange is not configured for code ${code}`);
  }

  async refreshAccessToken(): Promise<MarketplaceCredentials> {
    throw new Error('Lazada token refresh is not configured');
  }

  async validateListing(listing: Listing): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    if (!listing.title || listing.title.length < 5) {
      errors.push('Title must be at least 5 characters');
    }
    if (listing.title.length > 200) {
      errors.push('Title must not exceed 200 characters');
    }
    if (!listing.description || listing.description.length < 20) {
      errors.push('Description must be at least 20 characters');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async publishListing(listing: Listing): Promise<PublishResult> {
    const validation = await this.validateListing(listing);
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors?.join(', ')}`,
      };
    }

    try {
      return { success: false, error: 'Lazada publishing is not configured' };
    } catch (error) {
      return {
        success: false,
        error: `Failed to publish to Lazada: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async updateListing(platformListingId: string, _listing: Listing): Promise<PublishResult> {
    return { success: false, error: `Lazada update is not configured for ${platformListingId}` };
  }

  async unpublishListing(platformListingId: string): Promise<PublishResult> {
    return { success: false, error: `Lazada unpublish is not configured for ${platformListingId}` };
  }

  async validateCredentials(): Promise<boolean> {
    try {
      return false;
    } catch (error) {
      console.error('Lazada credential validation failed:', error);
      return false;
    }
  }

  async getShopInfo(): Promise<Record<string, any>> {
    throw new Error('Lazada shop lookup is not configured');
  }
}

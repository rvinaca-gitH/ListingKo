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
    console.log('Lazada: Exchanging code for token:', code);
    return {
      accessToken: `lazada_token_${Date.now()}`,
      shopId: this.credentials.shopId,
      shopName: this.credentials.shopName,
    };
  }

  async refreshAccessToken(): Promise<MarketplaceCredentials> {
    console.log('Lazada: Refreshing access token');
    return this.credentials;
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
      const platformListingId = `lazada_${Date.now()}`;
      console.log('Lazada: Publishing listing:', {
        listingId: listing.id,
        title: listing.title,
        platformListingId,
      });

      return {
        success: true,
        platformListingId,
        details: {
          marketplace: 'lazada',
          publishedAt: new Date().toISOString(),
          shopId: this.credentials.shopId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to publish to Lazada: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async updateListing(platformListingId: string, listing: Listing): Promise<PublishResult> {
    console.log('Lazada: Updating listing:', platformListingId);
    return { success: true, platformListingId };
  }

  async unpublishListing(platformListingId: string): Promise<PublishResult> {
    console.log('Lazada: Unpublishing listing:', platformListingId);
    return { success: true, platformListingId };
  }

  async validateCredentials(): Promise<boolean> {
    try {
      console.log('Lazada: Validating credentials');
      return true;
    } catch (error) {
      console.error('Lazada credential validation failed:', error);
      return false;
    }
  }

  async getShopInfo(): Promise<Record<string, any>> {
    return {
      shopId: this.credentials.shopId,
      shopName: this.credentials.shopName,
    };
  }
}

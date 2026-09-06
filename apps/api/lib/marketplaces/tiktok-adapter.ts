import { Listing } from '@listingko/shared-types';
import { MarketplaceAdapter, MarketplaceConfig, MarketplaceCredentials, PublishResult } from './base-adapter';

const TIKTOK_CONFIG: MarketplaceConfig = {
  clientId: process.env.TIKTOK_CLIENT_ID || '',
  clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
  redirectUri: process.env.TIKTOK_REDIRECT_URI || 'http://localhost:3000/api/oauth/tiktok/callback',
  authorizationUrl: 'https://auth.tiktok.com/oauth/authorize',
  tokenUrl: 'https://auth.tiktok.com/oauth/token',
  apiBaseUrl: 'https://open-api.tiktokglobalshop.com/api',
};

export class TikTokAdapter extends MarketplaceAdapter {
  constructor(credentials: MarketplaceCredentials) {
    super('tiktok', TIKTOK_CONFIG, credentials);
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      state,
      scope: 'shop.basic,product.create,product.edit',
    });
    return `${this.config.authorizationUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<MarketplaceCredentials> {
    console.log('TikTok: Exchanging code for token:', code);
    return {
      accessToken: `tiktok_token_${Date.now()}`,
      shopId: this.credentials.shopId,
      shopName: this.credentials.shopName,
    };
  }

  async refreshAccessToken(): Promise<MarketplaceCredentials> {
    console.log('TikTok: Refreshing access token');
    return this.credentials;
  }

  async validateListing(listing: Listing): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    if (!listing.title || listing.title.length < 10) {
      errors.push('Title must be at least 10 characters');
    }
    if (listing.title.length > 120) {
      errors.push('Title must not exceed 120 characters');
    }
    if (!listing.description || listing.description.length < 20) {
      errors.push('Description must be at least 20 characters');
    }
    if (listing.description.length > 5000) {
      errors.push('Description must not exceed 5000 characters');
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
      const platformListingId = `tiktok_${Date.now()}`;
      console.log('TikTok: Publishing listing:', {
        listingId: listing.id,
        title: listing.title,
        platformListingId,
      });

      return {
        success: true,
        platformListingId,
        details: {
          marketplace: 'tiktok',
          publishedAt: new Date().toISOString(),
          shopId: this.credentials.shopId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to publish to TikTok Shop: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async updateListing(platformListingId: string, listing: Listing): Promise<PublishResult> {
    console.log('TikTok: Updating listing:', platformListingId);
    return { success: true, platformListingId };
  }

  async unpublishListing(platformListingId: string): Promise<PublishResult> {
    console.log('TikTok: Unpublishing listing:', platformListingId);
    return { success: true, platformListingId };
  }

  async validateCredentials(): Promise<boolean> {
    try {
      console.log('TikTok: Validating credentials');
      return true;
    } catch (error) {
      console.error('TikTok credential validation failed:', error);
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

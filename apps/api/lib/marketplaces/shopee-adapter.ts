import { Listing } from '@listingko/shared-types';
import { MarketplaceAdapter, MarketplaceConfig, MarketplaceCredentials, PublishResult } from './base-adapter';

const SHOPEE_CONFIG: MarketplaceConfig = {
  clientId: process.env.SHOPEE_CLIENT_ID || '',
  clientSecret: process.env.SHOPEE_CLIENT_SECRET || '',
  redirectUri: process.env.SHOPEE_REDIRECT_URI || 'http://localhost:3000/api/oauth/shopee/callback',
  authorizationUrl: 'https://partner.shopeemobile.com/api/v2/oauth/authorize',
  tokenUrl: 'https://partner.shopeemobile.com/api/v2/oauth/token',
  apiBaseUrl: 'https://partner.shopeemobile.com/api/v2',
};

export class ShopeeAdapter extends MarketplaceAdapter {
  constructor(credentials: MarketplaceCredentials) {
    super('shopee', SHOPEE_CONFIG, credentials);
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
    // TODO: Call Shopee API to exchange code for token
    // For now, return mock implementation
    console.log('Shopee: Exchanging code for token:', code);
    return {
      accessToken: `shopee_token_${Date.now()}`,
      shopId: this.credentials.shopId,
      shopName: this.credentials.shopName,
    };
  }

  async refreshAccessToken(): Promise<MarketplaceCredentials> {
    // TODO: Call Shopee API to refresh token
    console.log('Shopee: Refreshing access token');
    return this.credentials;
  }

  async validateListing(listing: Listing): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    // Shopee-specific validation
    if (!listing.title || listing.title.length < 10) {
      errors.push('Title must be at least 10 characters');
    }
    if (listing.title.length > 255) {
      errors.push('Title must not exceed 255 characters');
    }
    if (!listing.description || listing.description.length < 50) {
      errors.push('Description must be at least 50 characters');
    }
    if (listing.description.length > 3000) {
      errors.push('Description must not exceed 3000 characters');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async publishListing(listing: Listing): Promise<PublishResult> {
    // Validate first
    const validation = await this.validateListing(listing);
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors?.join(', ')}`,
      };
    }

    try {
      // TODO: Call Shopee API to publish listing
      // This is a mock implementation
      const platformListingId = `shopee_${Date.now()}`;

      console.log('Shopee: Publishing listing:', {
        listingId: listing.id,
        title: listing.title,
        platformListingId,
      });

      return {
        success: true,
        platformListingId,
        details: {
          marketplace: 'shopee',
          publishedAt: new Date().toISOString(),
          shopId: this.credentials.shopId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to publish to Shopee: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async updateListing(platformListingId: string, listing: Listing): Promise<PublishResult> {
    // TODO: Implement Shopee API call to update listing
    console.log('Shopee: Updating listing:', platformListingId);
    return {
      success: true,
      platformListingId,
    };
  }

  async unpublishListing(platformListingId: string): Promise<PublishResult> {
    // TODO: Implement Shopee API call to delete listing
    console.log('Shopee: Unpublishing listing:', platformListingId);
    return {
      success: true,
      platformListingId,
    };
  }

  async validateCredentials(): Promise<boolean> {
    try {
      // TODO: Call Shopee API to validate token
      console.log('Shopee: Validating credentials');
      return true;
    } catch (error) {
      console.error('Shopee credential validation failed:', error);
      return false;
    }
  }

  async getShopInfo(): Promise<Record<string, any>> {
    // TODO: Call Shopee API to get shop info
    return {
      shopId: this.credentials.shopId,
      shopName: this.credentials.shopName,
    };
  }
}

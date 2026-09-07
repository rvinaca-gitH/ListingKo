import { Listing } from '@listingko/shared-types';
import { MarketplaceAdapter, MarketplaceConfig, MarketplaceCredentials, PublishResult } from './base-adapter';

const FACEBOOK_CONFIG: MarketplaceConfig = {
  clientId: process.env.FACEBOOK_CLIENT_ID || '',
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
  redirectUri: process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/api/oauth/facebook/callback',
  authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
  tokenUrl: 'https://graph.instagram.com/v18.0/oauth/access_token',
  apiBaseUrl: 'https://graph.instagram.com/v18.0',
};

export class FacebookAdapter extends MarketplaceAdapter {
  constructor(credentials: MarketplaceCredentials) {
    super('facebook', FACEBOOK_CONFIG, credentials);
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      state,
      scope: 'catalog_management,business_management',
    });
    return `${this.config.authorizationUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<MarketplaceCredentials> {
    throw new Error(`Facebook OAuth exchange is not configured for code ${code}`);
  }

  async refreshAccessToken(): Promise<MarketplaceCredentials> {
    throw new Error('Facebook token refresh is not configured');
  }

  async validateListing(listing: Listing): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    if (!listing.title || listing.title.length < 5) {
      errors.push('Title must be at least 5 characters');
    }
    if (listing.title.length > 100) {
      errors.push('Title must not exceed 100 characters');
    }
    if (!listing.description || listing.description.length < 10) {
      errors.push('Description must be at least 10 characters');
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
      return { success: false, error: 'Facebook publishing is not configured' };
    } catch (error) {
      return {
        success: false,
        error: `Failed to publish to Facebook: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async updateListing(platformListingId: string, _listing: Listing): Promise<PublishResult> {
    return { success: false, error: `Facebook update is not configured for ${platformListingId}` };
  }

  async unpublishListing(platformListingId: string): Promise<PublishResult> {
    return { success: false, error: `Facebook unpublish is not configured for ${platformListingId}` };
  }

  async validateCredentials(): Promise<boolean> {
    try {
      return false;
    } catch (error) {
      console.error('Facebook credential validation failed:', error);
      return false;
    }
  }

  async getShopInfo(): Promise<Record<string, any>> {
    throw new Error('Facebook shop lookup is not configured');
  }
}

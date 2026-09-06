import { Listing } from '@listingko/shared-types';

export interface MarketplaceConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  apiBaseUrl: string;
}

export interface PublishResult {
  success: boolean;
  platformListingId?: string;
  error?: string;
  details?: Record<string, any>;
}

export interface MarketplaceCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  shopId: string;
  shopName: string;
}

export abstract class MarketplaceAdapter {
  protected marketplace: string;
  protected config: MarketplaceConfig;
  protected credentials: MarketplaceCredentials;

  constructor(marketplace: string, config: MarketplaceConfig, credentials: MarketplaceCredentials) {
    this.marketplace = marketplace;
    this.config = config;
    this.credentials = credentials;
  }

  // OAuth flow
  abstract getAuthorizationUrl(state: string): string;
  abstract exchangeCodeForToken(code: string): Promise<MarketplaceCredentials>;
  abstract refreshAccessToken(): Promise<MarketplaceCredentials>;

  // Publishing
  abstract validateListing(listing: Listing): Promise<{ valid: boolean; errors?: string[] }>;
  abstract publishListing(listing: Listing): Promise<PublishResult>;
  abstract updateListing(platformListingId: string, listing: Listing): Promise<PublishResult>;
  abstract unpublishListing(platformListingId: string): Promise<PublishResult>;

  // Health
  abstract validateCredentials(): Promise<boolean>;
  abstract getShopInfo(): Promise<Record<string, any>>;
}

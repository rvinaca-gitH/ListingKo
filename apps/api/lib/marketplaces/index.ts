import { MarketplaceAdapter, MarketplaceCredentials } from './base-adapter';
import { ShopeeAdapter } from './shopee-adapter';
import { LazadaAdapter } from './lazada-adapter';
import { TikTokAdapter } from './tiktok-adapter';
import { FacebookAdapter } from './facebook-adapter';

export { MarketplaceAdapter } from './base-adapter';
export type { MarketplaceCredentials, PublishResult } from './base-adapter';

export class MarketplaceAdapterFactory {
  static createAdapter(
    marketplace: string,
    credentials: MarketplaceCredentials
  ): MarketplaceAdapter {
    switch (marketplace.toLowerCase()) {
      case 'shopee':
        return new ShopeeAdapter(credentials);
      case 'lazada':
        return new LazadaAdapter(credentials);
      case 'tiktok':
        return new TikTokAdapter(credentials);
      case 'facebook':
        return new FacebookAdapter(credentials);
      default:
        throw new Error(`Unsupported marketplace: ${marketplace}`);
    }
  }

  static getSupportedMarketplaces(): string[] {
    return ['shopee', 'lazada', 'tiktok', 'facebook'];
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, CreateProductInput, UpdateProductInput, Product, PaginatedResponse } from '@listingko/shared-types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export class MobileApiClient {
  static async getAuthToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        // Dev mode: use mock token
        if (process.env.NODE_ENV === 'development') {
          console.warn('[DEV MODE] Using mock auth token');
          return 'dev-mock-token-' + Date.now();
        }
        return null;
      }
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  static async setAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  static async clearAuthToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Error clearing auth token:', error);
    }
  }

  static async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(typeof options.headers === 'object' ? (options.headers as Record<string, string>) : {}),
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = (await response.json()) as ApiResponse<T>;

      if (!response.ok) {
        throw new Error(data.error?.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Products
  static async createProduct(input: CreateProductInput): Promise<Product> {
    const response = await this.fetch<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (!response.data) throw new Error('No product returned');
    return response.data;
  }

  static async getProducts(): Promise<ApiResponse<PaginatedResponse<Product>>> {
    return this.fetch<PaginatedResponse<Product>>('/api/products', {
      method: 'GET',
    });
  }

  static async getProduct(id: string): Promise<any> {
    const response = await this.fetch<any>(`/api/products/${id}`, {
      method: 'GET',
    });
    if (!response.data) throw new Error('No product returned');
    return response.data;
  }

  static async updateProduct(id: string, input: UpdateProductInput): Promise<ApiResponse<Product>> {
    return this.fetch<Product>(`/api/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  // Analyze
  static async analyzeProduct(productId: string): Promise<any> {
    const response = await this.fetch<any>(`/api/products/${productId}/analyze`, {
      method: 'POST',
    });
    if (!response.data) throw new Error('Analysis failed');
    return response.data;
  }

  // Listings
  static async generateListings(productId: string, platforms: string[]): Promise<any> {
    const response = await this.fetch<any>('/api/listings', {
      method: 'POST',
      body: JSON.stringify({ productId, platforms }),
    });
    return response.data;
  }

  static async getListings(productId: string): Promise<any[]> {
    const response = await this.fetch<any>(`/api/listings?productId=${productId}`, {
      method: 'GET',
    });
    return response.data?.items || [];
  }

  // QA Results
  static async getQAResults(productId: string): Promise<any[]> {
    const response = await this.fetch<any[]>(`/api/qa-results?productId=${productId}`, {
      method: 'GET',
    });
    return response.data || [];
  }

  // Export
  static async exportProduct(productId: string, format: 'json' | 'csv'): Promise<Blob> {
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_URL}/api/products/${productId}/export?format=${format}`,
      { method: 'POST', headers }
    );

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }

  // Marketplace
  static async getMarketplaceConnections(): Promise<any[]> {
    const response = await this.fetch<any[]>('/api/marketplace-connections', {
      method: 'GET',
    });
    return response.data || [];
  }

  static async createMarketplaceConnection(data: {
    marketplace: string;
    credentials?: any;
    shopId?: string;
    shopName?: string;
  }): Promise<any> {
    const response = await this.fetch<any>('/api/marketplace-connections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  static async deleteMarketplaceConnection(id: string): Promise<void> {
    await this.fetch<void>(`/api/marketplace-connections/${id}`, {
      method: 'DELETE',
    });
  }

  // OAuth
  static async getOAuthUrl(marketplace: string): Promise<string> {
    const response = await this.fetch<any>('/api/oauth/authorize', {
      method: 'POST',
      body: JSON.stringify({ marketplace }),
    });
    return response.data?.authorizationUrl || '';
  }

  // Images
  static async uploadImage(productId: string, file: any): Promise<any> {
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('productId', productId);

    const response = await fetch(`${API_URL}/api/images/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  static async generateImages(productId: string): Promise<any[]> {
    const response = await this.fetch<any>('/api/images/generate', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
    return response.data?.images || [];
  }

  static async deleteImage(imageId: string): Promise<void> {
    await this.fetch<void>(`/api/images/${imageId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = MobileApiClient;

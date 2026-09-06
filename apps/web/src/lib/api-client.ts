import { supabase } from './supabase';
import { ApiResponse, CreateProductInput, UpdateProductInput, Product, PaginatedResponse } from '@listingko/shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class ApiClient {
  static async getAuthToken(): Promise<string | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      // Dev mode: generate mock token when Supabase is unavailable
      if (process.env.NEXT_PUBLIC_ENV === 'development') {
        console.warn('[DEV MODE] Using mock auth token');
        return 'dev-mock-token-' + Date.now();
      }
      return null;
    }
    return data.session.access_token;
  }

  static async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
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
    const response = await this.fetch<PaginatedResponse<Product>>('/api/products', {
      method: 'GET',
    });
    return response;
  }

  static async getProduct(id: string): Promise<any> {
    const response = await this.fetch<any>(`/api/products/${id}`, {
      method: 'GET',
    });
    if (!response.data) throw new Error('No product returned');
    return response.data;
  }

  static async listProducts(): Promise<Product[]> {
    const response = await this.fetch<any>('/api/products', {
      method: 'GET',
    });
    return response.data?.items || [];
  }

  static async updateProduct(id: string, input: UpdateProductInput): Promise<ApiResponse<Product>> {
    const response = await this.fetch<Product>(`/api/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return response;
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
  static async generateListings(
    productId: string,
    platforms: string[]
  ): Promise<any> {
    const response = await this.fetch<any>('/api/listings', {
      method: 'POST',
      body: JSON.stringify({
        productId,
        platforms,
      }),
    });
    return response.data;
  }

  static async generateListing(listingId: string): Promise<any> {
    const response = await this.fetch<any>('/api/listings/generate', {
      method: 'POST',
      body: JSON.stringify({
        listingId,
      }),
    });
    if (!response.data) throw new Error('Listing generation failed');
    return response.data;
  }
}

const apiClient = {
  createProduct: ApiClient.createProduct.bind(ApiClient),
  getProducts: ApiClient.getProducts.bind(ApiClient),
  getProduct: ApiClient.getProduct.bind(ApiClient),
  listProducts: ApiClient.listProducts.bind(ApiClient),
  updateProduct: ApiClient.updateProduct.bind(ApiClient),
  analyzeProduct: ApiClient.analyzeProduct.bind(ApiClient),
  generateListings: ApiClient.generateListings.bind(ApiClient),
  generateListing: ApiClient.generateListing.bind(ApiClient),
};

export { apiClient };
export default ApiClient;

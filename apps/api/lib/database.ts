import { createClient } from '@supabase/supabase-js';
import { User, Product, ProductMaster, Listing, QAResult, Image, Subscription, Entitlements } from '@listingko/shared-types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================================
// DATABASE HELPERS
// ============================================================================

export class Database {
  // Users
  static async getUser(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  static async createUser(user: Omit<User, 'created_at' | 'updated_at'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Products
  static async listProducts(userId: string, limit = 50, offset = 0): Promise<{ data: Product[]; total: number }> {
    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data: data || [], total: count || 0 };
  }

  static async getProduct(productId: string, userId: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data;
  }

  static async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProduct(productId: string, userId: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async softDeleteProduct(productId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Product Masters
  static async getProductMaster(productId: string, userId: string): Promise<ProductMaster | null> {
    const { data, error } = await supabase
      .from('product_masters')
      .select('*')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async createProductMaster(master: Omit<ProductMaster, 'created_at' | 'updated_at'>): Promise<ProductMaster> {
    const { data, error } = await supabase
      .from('product_masters')
      .insert([master])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProductMaster(masterId: string, updates: Partial<ProductMaster>): Promise<ProductMaster> {
    const { data, error } = await supabase
      .from('product_masters')
      .update(updates)
      .eq('id', masterId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Listings
  static async listListings(userId: string, filter?: { productId?: string; platform?: string; status?: string }): Promise<Listing[]> {
    let query = supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (filter?.productId) {
      query = query.eq('product_id', filter.productId);
    }
    if (filter?.platform) {
      query = query.eq('platform', filter.platform);
    }
    if (filter?.status) {
      query = query.eq('status', filter.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getListing(listingId: string, userId: string): Promise<Listing | null> {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async createListing(listing: Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Listing> {
    const { data, error } = await supabase
      .from('listings')
      .insert([listing])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateListing(listingId: string, updates: Partial<Listing>): Promise<Listing> {
    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', listingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async softDeleteListing(listingId: string): Promise<void> {
    const { error } = await supabase
      .from('listings')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', listingId);

    if (error) throw error;
  }

  // QA Results
  static async createQAResult(result: Omit<QAResult, 'id' | 'created_at'>): Promise<QAResult> {
    const { data, error } = await supabase
      .from('qa_results')
      .insert([result])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getQAResult(qaResultId: string): Promise<QAResult | null> {
    const { data, error } = await supabase
      .from('qa_results')
      .select('*')
      .eq('id', qaResultId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  // Images
  static async listImages(userId: string, filter?: { productId?: string; type?: string }): Promise<Image[]> {
    let query = supabase
      .from('images')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (filter?.productId) {
      query = query.eq('product_id', filter.productId);
    }
    if (filter?.type) {
      query = query.eq('type', filter.type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createImage(image: Omit<Image, 'id' | 'created_at'>): Promise<Image> {
    const { data, error } = await supabase
      .from('images')
      .insert([image])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async softDeleteImage(imageId: string): Promise<void> {
    const { error } = await supabase
      .from('images')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', imageId);

    if (error) throw error;
  }

  // Subscriptions
  static async getSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async createSubscription(subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([subscription])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Entitlements
  static async getEntitlements(userId: string): Promise<Entitlements | null> {
    const { data, error } = await supabase
      .from('entitlements')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  static async createEntitlements(entitlements: Omit<Entitlements, 'id' | 'created_at' | 'updated_at'>): Promise<Entitlements> {
    const { data, error } = await supabase
      .from('entitlements')
      .insert([entitlements])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export default Database;

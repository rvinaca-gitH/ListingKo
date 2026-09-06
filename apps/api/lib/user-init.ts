import Database from './database';

/**
 * Initialize a new user after signup
 * Creates user record, subscription, and entitlements
 */
export async function initializeNewUser(userId: string, email: string, fullName?: string): Promise<void> {
  try {
    // Check if user already exists
    const existingUser = await Database.getUser(userId);
    if (existingUser) {
      console.log(`User ${userId} already initialized`);
      return;
    }

    // Create user record
    await Database.createUser({
      id: userId,
      email,
      full_name: fullName,
      email_notifications: true,
      dark_mode: false,
    });

    // Create FREE subscription
    const subscription = await Database.createSubscription({
      user_id: userId,
      plan: 'FREE',
      status: 'ACTIVE',
      started_at: new Date().toISOString(),
    });

    // Create FREE tier entitlements
    await Database.createEntitlements({
      subscription_id: subscription.id,
      user_id: userId,
      products_per_month: 10,
      images_per_product: 5,
      ai_generations_per_month: 50,
      marketplace_integrations: false,
      bulk_operations: false,
      direct_publishing: false,
    });

    console.log(`User ${userId} initialized successfully`);
  } catch (error) {
    console.error(`Failed to initialize user ${userId}:`, error);
    throw error;
  }
}

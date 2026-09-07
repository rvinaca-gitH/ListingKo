import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Product } from '@listingko/shared-types';
import { apiClient } from '../../lib/api-client';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#e0e0e0',
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function HomeScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getProducts();
      setProducts(response.data?.items || []);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ListingKo</Text>
        <Text style={styles.headerSubtitle}>
          One product in → complete launch package out
        </Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{products.length}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{products.length * 4}</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>10</Text>
            <Text style={styles.statLabel}>Free Left</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/screens/create-product')}
          >
            <Text style={styles.cardTitle}>Create New Product</Text>
            <Text style={styles.cardSubtitle}>
              Start a new product launch
            </Text>
            <View style={styles.button}>
              <Text style={styles.buttonText}>+ New Product</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/screens/marketplace')}
          >
            <Text style={styles.cardTitle}>Marketplace Settings</Text>
            <Text style={styles.cardSubtitle}>
              Connect your sales channels
            </Text>
            <View style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Configure</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Products */}
        {products.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Products</Text>

            {products.slice(0, 3).map((product: any) => (
              <TouchableOpacity
                key={product.id}
                style={styles.card}
                onPress={() =>
                  router.push(`/screens/product/${product.id}`)
                }
              >
                <Text style={styles.cardTitle}>{product.title}</Text>
                <Text style={styles.cardSubtitle}>
                  {product.category || 'Uncategorized'}
                </Text>
                <View style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>View</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {products.length === 0 && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>No products yet</Text>
              <Text style={styles.cardSubtitle}>
                Create your first product to get started
              </Text>
              <View style={styles.button}>
                <Text style={styles.buttonText}>Create Product</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

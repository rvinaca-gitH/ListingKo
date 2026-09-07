import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Product, ProductMaster, Listing } from '@listingko/shared-types';
import { apiClient } from '../../../lib/api-client';

const palette = {
  ink: '#13224B',
  muted: '#64708D',
  orange: '#FF671D',
  blue: '#1683F5',
  green: '#17A673',
  paper: '#F8FAFD',
  white: '#FFFFFF',
  line: '#E5EAF2',
};

type TabType = 'analysis' | 'listings' | 'qa' | 'export';

export default function ProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [master, setMaster] = useState<ProductMaster | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('analysis');

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getProduct(id!);
      if (response.success && response.data) {
        setProduct(response.data.product || null);
        setMaster(response.data.productMaster || null);
        setListings(response.data.listings || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load product');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!id) return;
    try {
      setLoading(true);
      await apiClient.analyzeProduct(id);
      await loadProduct();
      Alert.alert('Success', 'Product analyzed!');
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze product');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateListings = async () => {
    if (!id) return;
    try {
      setLoading(true);
      await apiClient.generateListings({
        productId: id,
        platforms: ['shopee', 'lazada', 'tiktok', 'facebook'],
      });
      await loadProduct();
      Alert.alert('Success', 'Listings generated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate listings');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.orange} />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Product not found</Text>
          <Pressable style={styles.errorButton} onPress={() => router.back()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.paper} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <View />
        </View>

        <View style={styles.productCard}>
          <Text style={styles.productTitle}>{product.title}</Text>
          <Text style={styles.productCategory}>{product.category}</Text>
          <Text style={styles.productDesc} numberOfLines={3}>
            {product.description}
          </Text>
        </View>

        <View style={styles.tabs}>
          {(['analysis', 'listings', 'qa', 'export'] as TabType[]).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'analysis' && (
          <View style={styles.section}>
            {master ? (
              <>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>SKU</Text>
                  <Text style={styles.infoValue}>{master.sku}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Strengths</Text>
                  <View>
                    {(master.strengths || []).map((strength, idx) => (
                      <Text key={idx} style={styles.infoItem}>
                        • {strength}
                      </Text>
                    ))}
                  </View>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Target Customer</Text>
                  <Text style={styles.infoValue}>{master.target_customer}</Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>SEO Keywords</Text>
                  <View style={styles.tagsContainer}>
                    {(master.keywords || []).map((keyword: string, idx: number) => (
                      <Text key={idx} style={styles.tag}>
                        {keyword}
                      </Text>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              <Pressable style={styles.button} onPress={handleAnalyze} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={palette.white} />
                ) : (
                  <>
                    <Text style={styles.buttonIcon}>✦</Text>
                    <Text style={styles.buttonText}>Analyze with AI</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        )}

        {activeTab === 'listings' && (
          <View style={styles.section}>
            {listings.length > 0 ? (
              listings.map((listing) => (
                <View key={listing.id} style={styles.listingCard}>
                  <Text style={styles.listingPlatform}>{listing.platform?.toUpperCase()}</Text>
                  <Text style={styles.listingTitle}>{listing.title}</Text>
                  <Text style={styles.listingDesc} numberOfLines={2}>
                    {listing.description}
                  </Text>
                </View>
              ))
            ) : (
              <Pressable style={styles.button} onPress={handleGenerateListings} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={palette.white} />
                ) : (
                  <>
                    <Text style={styles.buttonIcon}>✦</Text>
                    <Text style={styles.buttonText}>Generate Listings</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        )}

        {activeTab === 'qa' && (
          <View style={styles.section}>
            <Text style={styles.placeholderText}>QA feature coming soon</Text>
          </View>
        )}

        {activeTab === 'export' && (
          <View style={styles.section}>
            <Text style={styles.placeholderText}>Export feature coming soon</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: palette.muted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: palette.muted,
    marginBottom: 16,
  },
  errorButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: palette.blue,
  },
  errorButtonText: {
    color: palette.white,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  back: {
    fontSize: 16,
    color: palette.blue,
    fontWeight: '600',
  },
  productCard: {
    backgroundColor: palette.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: palette.line,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.ink,
    marginBottom: 8,
  },
  productCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.muted,
    marginBottom: 8,
  },
  productDesc: {
    fontSize: 14,
    color: palette.muted,
    lineHeight: 20,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    marginBottom: 24,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: palette.blue,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.muted,
  },
  tabTextActive: {
    color: palette.blue,
  },
  section: {
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: palette.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.line,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.muted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.ink,
  },
  infoItem: {
    fontSize: 14,
    color: palette.ink,
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: palette.paper,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '500',
    color: palette.blue,
  },
  listingCard: {
    backgroundColor: palette.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.line,
  },
  listingPlatform: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.orange,
    marginBottom: 4,
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.ink,
    marginBottom: 4,
  },
  listingDesc: {
    fontSize: 13,
    color: palette.muted,
    lineHeight: 18,
  },
  button: {
    backgroundColor: palette.orange,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonIcon: {
    fontSize: 18,
    color: palette.white,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.white,
  },
  placeholderText: {
    fontSize: 16,
    color: palette.muted,
    textAlign: 'center',
    paddingVertical: 40,
  },
});

import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
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
  red: '#E94763',
};

export default function NewProductScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics',
  });
  const [loading, setLoading] = useState(false);

  const handleCreateProduct = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Missing Title', 'Please enter a product title');
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert('Missing Description', 'Please enter a product description');
      return;
    }

    setLoading(true);
    try {
      const product = await apiClient.createProduct(formData);
      Alert.alert('Success', 'Product created! Redirecting...', [
        {
          text: 'OK',
          onPress: () => router.push(`/screens/product/${product.id}`),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.paper} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Text style={styles.title}>New Listing</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Information</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Product Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Wireless Bluetooth Headphones"
              placeholderTextColor={palette.muted}
              value={formData.title}
              onChangeText={(title) => setFormData({ ...formData, title })}
              editable={!loading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your product features, materials, usage..."
              placeholderTextColor={palette.muted}
              value={formData.description}
              onChangeText={(description) => setFormData({ ...formData, description })}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!loading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryOptions}>
              {['Electronics', 'Fashion', 'Home', 'Sports', 'Beauty'].map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.categoryButton,
                    formData.category === cat && styles.categoryButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, category: cat })}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      formData.category === cat && styles.categoryButtonTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
            onPress={handleCreateProduct}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={palette.white} />
            ) : (
              <>
                <Text style={styles.buttonIcon}>✦</Text>
                <Text style={styles.buttonText}>Create & Analyze</Text>
              </>
            )}
          </Pressable>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  back: {
    fontSize: 16,
    color: palette.blue,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.ink,
  },
  spacer: {
    width: 50,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.ink,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.ink,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: palette.ink,
    backgroundColor: palette.white,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
  },
  categoryButtonActive: {
    backgroundColor: palette.blue,
    borderColor: palette.blue,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.ink,
  },
  categoryButtonTextActive: {
    color: palette.white,
  },
  actions: {
    paddingVertical: 20,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: palette.orange,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    fontSize: 18,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.white,
  },
});

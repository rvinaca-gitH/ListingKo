import { View, Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    color: '#999',
    marginTop: 20,
  },
});

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ListingKo</Text>
      <Text style={styles.subtitle}>
        AI Ecommerce Product Launch Factory
      </Text>
      <Text style={styles.subtitle}>
        One product in → complete launch package out
      </Text>
      <Text style={styles.status}>
        Mobile app is ready for Phase 2 implementation
      </Text>
    </View>
  );
}

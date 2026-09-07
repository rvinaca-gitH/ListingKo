import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'ListingKo',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="screens/new-product/index"
        options={{
          title: 'New Listing',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="screens/product/[id]"
        options={{
          title: 'Product',
          headerShown: false,
        }}
      />
    </Stack>
  );
}

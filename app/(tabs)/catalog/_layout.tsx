import { Stack } from 'expo-router';
import { ui } from '@/config';

export default function CatalogLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: ui.accent, headerTitleStyle: { fontSize: 17 } }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="product-form" options={{ title: 'Product', presentation: 'modal' }} />
      <Stack.Screen name="attribute-form" options={{ title: 'Attribute', presentation: 'modal' }} />
    </Stack>
  );
}

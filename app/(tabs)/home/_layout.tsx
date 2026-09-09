import { Stack } from 'expo-router';
import { ui } from '@/config';

/**
 * Home tab as a small stack (mirrors automations/, leads/) — index is the
 * hero/orders screen; account-settings and catalog are reached via the two
 * small icon buttons in its header (2026-09-09 footer reduction: neither
 * Settings nor Catalog kept its own tab, and neither was inlined into
 * Home's scrollable body either — see index.tsx and CLAUDE.md's
 * footer-reduction note for why: putting a destructive action like
 * Disconnect/Sign Out directly in a scrolling feed risks an accidental tap).
 * product-form/attribute-form are Catalog's forms, moved here from the
 * now-removed catalog/ tab.
 */
export default function HomeLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: ui.accent, headerTitleStyle: { fontSize: 17 } }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="account-settings" options={{ headerShown: false }} />
      <Stack.Screen name="catalog" options={{ headerShown: false }} />
      <Stack.Screen name="product-form" options={{ title: 'Product', presentation: 'modal' }} />
      <Stack.Screen name="attribute-form" options={{ title: 'Attribute', presentation: 'modal' }} />
    </Stack>
  );
}

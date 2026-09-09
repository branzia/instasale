import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ui } from '@/config';

// Outline/filled pairing for inactive/active tab state — mirrors the
// convention already used in the sibling Merchant app's tab bar
// (app/(tabs)/_layout.tsx there uses the same `focused ? on : off` shape).
const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  index: { on: 'home', off: 'home-outline' },
  posts: { on: 'camera', off: 'camera-outline' },
  automations: { on: 'flash', off: 'flash-outline' },
  leads: { on: 'document-text', off: 'document-text-outline' },
  catalog: { on: 'grid', off: 'grid-outline' },
  settings: { on: 'settings', off: 'settings-outline' },
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // Taller footer per explicit user call (2026-09-09) — plain Expo Router's
  // default tab bar height (~50px) felt cramped. Base height + safe-area
  // inset mirrors the sibling Merchant app's tabBarHeight approach
  // (app/(tabs)/_layout.tsx there), just with a taller base.
  const tabBarHeight = 68 + Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: ui.accent,
        tabBarInactiveTintColor: ui.placeholderText,
        tabBarStyle: {
          borderTopColor: ui.borderLight,
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color, focused }) => {
          const pair = ICONS[route.name];
          return <Ionicons name={focused ? pair.on : pair.off} size={22} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="posts" options={{ title: 'Posts & Reels' }} />
      <Tabs.Screen name="automations" options={{ title: 'Automations' }} />
      <Tabs.Screen name="leads" options={{ title: 'Leads' }} />
      <Tabs.Screen name="catalog" options={{ title: 'Catalog' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

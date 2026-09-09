import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ui } from '@/config';

// Outline/filled pairing for inactive/active tab state — mirrors the
// convention already used in the sibling Merchant app's tab bar
// (app/(tabs)/_layout.tsx there uses the same `focused ? on : off` shape).
const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  home: { on: 'home', off: 'home-outline' },
  posts: { on: 'camera', off: 'camera-outline' },
  automations: { on: 'flash', off: 'flash-outline' },
  leads: { on: 'document-text', off: 'document-text-outline' },
};

/**
 * Tab bar reduced from 6 to 4 items, 2026-09-09 (explicit user call): Home,
 * Posts & Reels, Automations, Leads. Settings and Catalog didn't survive as
 * tabs, but neither got inlined into another tab's body either (an earlier
 * pass tried folding Catalog into Automations as a Segment and Settings'
 * destructive actions — Disconnect Instagram, Sign Out — straight into
 * Home's scroll; both were explicit user corrections). Instead both are one
 * tap away from Home, behind small icon buttons in its header — see
 * home/index.tsx, home/catalog.tsx, home/account-settings.tsx, and
 * CLAUDE.md's footer-reduction note for the full reasoning. That's also why
 * Home is a folder (`home/`) with its own Stack now, instead of the flat
 * `index.tsx` it used to be — the icons need somewhere to push to.
 */
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
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="posts" options={{ title: 'Posts & Reels' }} />
      <Tabs.Screen name="automations" options={{ title: 'Automations' }} />
      <Tabs.Screen name="leads" options={{ title: 'Leads' }} />
    </Tabs>
  );
}

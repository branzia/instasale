import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { Pressable } from 'react-native';
import { ui } from '@/config';

/**
 * A plain native back chevron that always works, unlike the default
 * Stack back button — which only renders when THIS stack already has a
 * previous entry. Both builders are also reached by pushing across tabs
 * (Posts & Reels's "Ready to setup"/"Any post or reel" cards, Automations'
 * "+" menu), which can land here as the automations stack's first entry
 * with no in-stack history to pop, silently hiding the default back
 * button. `router.back()` when there's real history to pop, else fall back
 * to the Automations list.
 */
function BuilderBackButton() {
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/automations'))}
      hitSlop={12}
      style={{ paddingRight: 10 }}
    >
      <Ionicons name="chevron-back" size={26} color={ui.accent} />
    </Pressable>
  );
}

/**
 * Automations tab as a small stack (mirrors leads/) — index is the list,
 * comment-builder/dm-builder are the "Go Live" rule builders (added
 * 2026-09, mirroring the web's AutomationSetup/DmAutomationBuilder). Both
 * builder screens get a larger header title than the app's other Stack
 * screens (they're full multi-step flows, not a small detail/edit form) and
 * an explicit back button — see BuilderBackButton above.
 */
export default function AutomationsLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: ui.accent, headerTitleStyle: { fontSize: 17 } }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="comment-builder"
        options={{
          title: 'Smart Automation',
          headerTitleStyle: { fontSize: 21, fontWeight: '700' },
          headerLeft: BuilderBackButton,
        }}
      />
      <Stack.Screen
        name="dm-builder"
        options={{
          title: 'DM Auto Reply',
          headerTitleStyle: { fontSize: 21, fontWeight: '700' },
          headerLeft: BuilderBackButton,
        }}
      />
    </Stack>
  );
}

import { Stack } from 'expo-router';

/**
 * Automations tab as a small stack (mirrors leads/) — index is the list,
 * comment-builder/dm-builder are the "Go Live" rule builders (added
 * 2026-09, mirroring the web's AutomationSetup/DmAutomationBuilder). Both
 * builder screens render their own <ScreenHeader onBack={...} /> in-body
 * (headerShown: false here) instead of the native Stack header — the
 * native header's small height + bottom shadow didn't match the rest of
 * the app's borderless, big-title ScreenHeader look, and unlike a plain
 * `<Stack.Screen>` back button, the in-body one can fall back to the
 * Automations list when these are reached with no in-stack history to pop
 * (Posts & Reels's "Ready to setup"/"Any post or reel" cards, Automations'
 * own "+" menu can each land here as this stack's first entry).
 */
export default function AutomationsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="comment-builder" />
      <Stack.Screen name="dm-builder" />
    </Stack>
  );
}

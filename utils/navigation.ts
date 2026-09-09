import { router } from 'expo-router';

/**
 * `router.back()` when there's real in-stack history to pop, else replace
 * with the Automations list. Used by both "Go Live" rule builders
 * (comment-builder.tsx/dm-builder.tsx) — they're reached by pushing across
 * tabs (Posts & Reels's "Ready to setup"/"Any post or reel" cards,
 * Automations' own "+" menu), which can land here as the automations
 * stack's first entry with no history to pop.
 */
export function backOrToAutomations() {
  router.canGoBack() ? router.back() : router.replace('/(tabs)/automations');
}

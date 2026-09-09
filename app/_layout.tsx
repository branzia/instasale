import '../global.css';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Splash from '@/components/Splash';
import { subscribeToNotificationTaps } from '@/services/notifications';

/**
 * Onboarding gate, in order:
 *   1. Splash             — shown while AuthContext resolves the stored token
 *   2. (auth)/scan         — not signed in → scan a QR code shown on the
 *      already-authenticated Branzia web dashboard (no Login/Register form
 *      exists in this app — see (auth)/scan.tsx)
 *   3. (onboarding)/instagram-required — signed in, but hasn't connected an
 *      Instagram account yet. Connecting only ever happens on the web
 *      dashboard now — this screen is a passive wait/re-check state, not an
 *      in-app OAuth flow. (The former step 3, "Buy Instagram Automation",
 *      was removed 2026-09-09 — see CLAUDE.md — access is no longer gated
 *      in this app at all.)
 *   4. (tabs)              — fully set up
 * Each step's screen is also reachable directly, so this effect only
 * *redirects forward/back* when the current group doesn't match where the
 * account actually is — it never fights an already-correct location.
 */
function RootLayoutNav() {
  const { token, isLoading, isInstagramConnected } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    // useSegments()'s type is a union of per-route literal tuples, so
    // indexing beyond a route's own known length is a compile error even
    // when the runtime array does have that element for a different
    // route — widen to a plain string array before indexing.
    const parts = segments as readonly string[];
    const group = parts[0];
    const sub = parts[1];

    if (!token) {
      if (group !== '(auth)') router.replace('/(auth)/scan');
      return;
    }

    if (!isInstagramConnected) {
      if (!(group === '(onboarding)' && sub === 'instagram-required')) {
        router.replace('/(onboarding)/instagram-required');
      }
      return;
    }

    if (group === '(auth)' || group === '(onboarding)') {
      router.replace('/(tabs)');
    }
  }, [token, isLoading, isInstagramConnected, segments]);

  // Tap-to-navigate for push notifications (see services/notifications.ts's
  // resolveNotificationRoute) — only wired up once the account is fully
  // signed in and has connected Instagram, same gate as the redirect effect
  // above. Subscribing any earlier risks navigating into a (tabs) route the
  // gate above would immediately bounce back out of.
  const fullyOnboarded = !!token && isInstagramConnected;
  useEffect(() => {
    if (!fullyOnboarded) return;
    return subscribeToNotificationTaps((route) => router.push(route as any));
  }, [fullyOnboarded]);

  if (isLoading) return <Splash />;

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

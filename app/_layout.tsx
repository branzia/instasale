import '../global.css';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { subscribeToNotificationTaps } from '@/services/notifications';

/**
 * Onboarding gate, in order:
 *   1. Native splash       — held open (index.ts's preventAutoHideAsync())
 *      through this whole step, covering AuthContext resolving the stored
 *      token; there's deliberately no separate JS splash screen of our own
 *      here anymore (removed 2026-09-11 — see components/Splash.tsx's
 *      removal) — one native splash, extended, beats a native splash
 *      handing off into a look-alike JS one.
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

  // Hands off from the native splash (held open by index.ts's
  // preventAutoHideAsync()) once we've actually landed on a real
  // destination screen — NOT just once AuthContext has resolved. Bare "/"
  // (app/index.tsx, which renders null) has empty segments; the redirect
  // effect below only reaches a real (auth)/(onboarding)/(tabs) screen a
  // tick or two later. Hiding on `isLoading` alone (2026-09-11's first cut
  // at this) revealed that gap as a plain gray blank — index.tsx's null,
  // with nothing left to cover it — on a real device. Waiting for a
  // non-empty segments array means the splash stays up until there's
  // something real underneath it.
  useEffect(() => {
    if (isLoading) return;
    const parts = segments as readonly string[];
    if (parts.length === 0) return;
    SplashScreen.hideAsync();
  }, [isLoading, segments]);

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
      // '(tabs)' has no flat index route since Home became a folder
      // (`(tabs)/home/`, 2026-09-09 footer reduction — see CLAUDE.md), so
      // the bare group path no longer resolves; land on Home explicitly.
      router.replace('/(tabs)/home');
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

  // No JS-rendered loading UI here — the native splash above is still on
  // screen for the entirety of `isLoading`, so this is never visible.
  if (isLoading) return null;

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

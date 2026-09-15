/**
 * Route for bare "/" — otherwise unmatched, since the onboarding gate
 * (app/_layout.tsx's RootLayoutNav) only *redirects away* from wherever the
 * router already landed; it never gives Slot a route to render for "/"
 * itself. Without this file, a genuine cold launch (tapping the installed
 * app icon, as opposed to Expo Go's dev entry point) resolves to "/", which
 * matches nothing, and expo-router shows its built-in "Unmatched Route"
 * screen instead of ever reaching the redirect effect.
 *
 * Renders nothing (2026-09-11 — previously re-rendered components/Splash,
 * since removed): the native splash (held open by index.ts's
 * preventAutoHideAsync() until RootLayoutNav's AuthContext check resolves)
 * is still covering the screen for the entirety of this route's lifetime,
 * so there's nothing for this screen to visibly contribute. RootLayoutNav's
 * effect replaces it with (auth)/scan, (onboarding)/instagram-required, or
 * (tabs)/home on the very next tick.
 */
export default function Index() {
  return null;
}

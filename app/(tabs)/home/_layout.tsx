import { Stack } from 'expo-router';

/**
 * Home tab as a small stack (mirrors automations/, leads/) — index is the
 * hero/orders screen; account-settings and catalog are reached via the two
 * labeled `LinkRow`s under index's connection hero (2026-09-09 footer
 * reduction: neither Settings nor Catalog kept its own tab, and neither
 * was inlined into Home's scrollable body either — see index.tsx and
 * CLAUDE.md's footer-reduction note for why). Those rows started as two
 * bare icon buttons in the header — moved down and given a title +
 * description each after user feedback that unlabeled icons next to the
 * name weren't discoverable. product-form/attribute-form are Catalog's
 * forms, moved here from the now-removed catalog/ tab.
 *
 * Every screen here is headerShown: false and renders its own <ScreenHeader>
 * in-body — no screen in this stack uses the native header, so there's no
 * shared screenOptions left to set on the Stack itself.
 */
export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="account-settings" options={{ headerShown: false }} />
      <Stack.Screen name="catalog" options={{ headerShown: false }} />
      {/* headerShown: false on both — they render their own <ScreenHeader onBack={...} />
          in-body instead of the native Stack header, same reasoning and pattern as
          automations/_layout.tsx's builder screens: keeps every screen in the app on
          the one big-title header look instead of the native header's smaller,
          differently-styled title. */}
      <Stack.Screen name="product-form" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="attribute-form" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}

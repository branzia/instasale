import { Stack } from 'expo-router';

// headerShown: false on both — [id] (Lead detail) renders its own
// <ScreenHeader onBack={...} /> in-body instead of the native Stack header,
// same reasoning as home/_layout.tsx's product-form/attribute-form.
export default function LeadsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

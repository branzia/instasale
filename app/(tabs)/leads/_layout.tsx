import { Stack } from 'expo-router';
import { ui } from '@/config';

export default function LeadsLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: ui.accent, headerTitleStyle: { fontSize: 17 } }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Lead' }} />
    </Stack>
  );
}

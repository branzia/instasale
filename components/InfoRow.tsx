import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import Card from '@/components/Card';
import { ui } from '@/config';

/**
 * Small icon-circle + title + body row, inside a Card shell — extracted
 * 2026-09-10 from (auth)/scan.tsx (its original single caller, "What
 * InstaSale does for you") so (onboarding)/instagram-required.tsx can reuse
 * the same treatment for its own "Why connect Instagram" section without
 * duplicating the row markup a second time.
 */
export default function InfoRow({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <Card className="flex-row items-start">
      <View className="w-10 h-10 rounded-full bg-brand-50 items-center justify-center mr-3">
        <Ionicons name={icon} size={18} color={ui.accent} />
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-semibold mb-0.5">{title}</Text>
        <Text className="text-gray-500 text-sm leading-5">{body}</Text>
      </View>
    </Card>
  );
}

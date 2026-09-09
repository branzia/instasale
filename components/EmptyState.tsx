import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { ui } from '@/config';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

/**
 * Centered "nothing here yet" state — shared by every list screen (Posts,
 * Automations, Leads/Orders, Catalog). Previously duplicated as identical
 * local components in leads/index.tsx and catalog/index.tsx, and hand-rolled
 * ad hoc in posts.tsx/automations.tsx.
 */
export default function EmptyState({ icon, title, body }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-10">
      <View className="w-16 h-16 rounded-full bg-brand-50 items-center justify-center mb-4">
        <Ionicons name={icon} size={28} color={ui.accent} />
      </View>
      <Text className="text-gray-900 font-semibold mb-1">{title}</Text>
      <Text className="text-gray-500 text-center text-sm">{body}</Text>
    </View>
  );
}

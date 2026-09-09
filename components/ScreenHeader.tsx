import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { gradientShort } from '@/config';

interface Props {
  title: string;
  subtitle?: string;
  action?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
}

/**
 * Shared "big title + optional right-side action" header — formalizes the
 * pattern every tab screen repeats (previously a bare `<Text>` on most
 * screens, a fuller title+button row hand-rolled only in catalog/index.tsx).
 * The action button, when present, is filled with the short Instagram
 * gradient rather than a flat brand color, echoing the same "primary action
 * gets the gradient" treatment used elsewhere (Home's status card, GradientButton).
 */
export default function ScreenHeader({ title, subtitle, action }: Props) {
  return (
    <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
      <View className="flex-1 mr-3">
        <Text className="text-2xl font-bold text-gray-900">{title}</Text>
        {subtitle && <Text className="text-gray-500 text-sm mt-0.5">{subtitle}</Text>}
      </View>
      {action && (
        <Pressable onPress={action.onPress}>
          <LinearGradient
            colors={gradientShort as unknown as [string, string]}
            style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name={action.icon} size={18} color="#fff" />
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}

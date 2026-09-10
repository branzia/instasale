import { Text, View } from 'react-native';

/**
 * Numbered step row for "how to do X" instructions — extracted 2026-09-10
 * from (auth)/scan.tsx (its original single caller) so the same
 * numbered-list treatment can be reused on (onboarding)/instagram-required.tsx
 * without duplicating the row markup a second time.
 */
export default function StepRow({ number, text }: { number: number; text: string }) {
  return (
    <View className="flex-row items-center mb-3">
      <View className="w-7 h-7 rounded-full bg-gray-900 items-center justify-center mr-3">
        <Text className="text-white text-xs font-bold">{number}</Text>
      </View>
      <Text className="flex-1 text-gray-700 text-sm leading-5">{text}</Text>
    </View>
  );
}

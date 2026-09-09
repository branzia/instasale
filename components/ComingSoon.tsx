import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ComingSoon({ title, emoji }: { title: string; emoji: string }) {
  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center">
      <Text className="text-5xl mb-4">{emoji}</Text>
      <Text className="text-xl font-bold text-gray-900 mb-1">{title}</Text>
      <Text className="text-gray-500">Coming soon</Text>
    </SafeAreaView>
  );
}

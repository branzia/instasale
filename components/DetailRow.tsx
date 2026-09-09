import { Text, View } from 'react-native';

interface Props {
  label: string;
  value: string;
}

/** Key/value row for detail screens — generalizes leads/[id].tsx's local `Row` (used 8+ times there). */
export default function DetailRow({ label, value }: Props) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className="text-gray-500">{label}</Text>
      <Text className="text-gray-900 font-medium">{value}</Text>
    </View>
  );
}

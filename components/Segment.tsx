import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { gradientShort } from '@/config';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Pill-toggle segmented control — shared by Leads/Orders and Catalog's
 * Products/Attributes screens (previously two byte-identical local copies).
 * The active pill is filled with the short Instagram gradient rather than a
 * flat brand color, giving these two screens a touch of the brand identity
 * they otherwise have none of.
 */
export default function Segment<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View className="flex-row px-4 pt-3 pb-2 gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable key={opt.value} onPress={() => onChange(opt.value)}>
            {active ? (
              <LinearGradient
                colors={gradientShort as unknown as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999 }}
              >
                <Text className="text-white text-sm font-medium">{opt.label}</Text>
              </LinearGradient>
            ) : (
              <View className="px-4 py-1.5 rounded-full bg-gray-100">
                <Text className="text-gray-600 text-sm font-medium">{opt.label}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

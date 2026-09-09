import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

interface Props {
  checked: boolean;
  onToggle: () => void;
  label: string;
}

/** Shared checkbox row — was an identical local component in both product-form.tsx and attribute-form.tsx. */
export default function Checkbox({ checked, onToggle, label }: Props) {
  return (
    <Pressable onPress={onToggle} className="flex-row items-center py-1">
      <View
        className={`w-5 h-5 rounded mr-2.5 items-center justify-center ${checked ? 'bg-brand-500' : 'bg-gray-100 border border-gray-300'}`}
      >
        {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
      <Text className="text-gray-900">{label}</Text>
    </Pressable>
  );
}

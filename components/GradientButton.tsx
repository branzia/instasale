import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, Text, ViewStyle } from 'react-native';
import { gradientShort } from '@/config';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

/** Primary CTA button, filled with the Instagram gradient. */
export default function GradientButton({ label, onPress, loading, disabled, icon, style }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable onPress={onPress} disabled={isDisabled} style={[{ opacity: isDisabled ? 0.6 : 1 }, style]}>
      <LinearGradient
        colors={gradientShort as unknown as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          flexDirection: 'row',
          borderRadius: 14,
          paddingVertical: 16,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            {icon && <Ionicons name={icon} size={18} color="#fff" />}
            <Text className="text-white text-base font-semibold">{label}</Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

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
  /** Smaller padding/type for a button sitting in a persistent bar (e.g. the
   * comment-builder's step action bar) rather than acting as a screen's one
   * big CTA. Default (false) is unchanged everywhere else. */
  compact?: boolean;
}

/** Primary CTA button, filled with the Instagram gradient. */
export default function GradientButton({ label, onPress, loading, disabled, icon, style, compact }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable onPress={onPress} disabled={isDisabled} style={[{ opacity: isDisabled ? 0.6 : 1 }, style]}>
      <LinearGradient
        colors={gradientShort as unknown as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          flexDirection: 'row',
          borderRadius: compact ? 12 : 14,
          paddingVertical: compact ? 10 : 16,
          alignItems: 'center',
          justifyContent: 'center',
          gap: compact ? 6 : 8,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size={compact ? 'small' : undefined} />
        ) : (
          <>
            {icon && <Ionicons name={icon} size={compact ? 15 : 18} color="#fff" />}
            <Text className={`text-white font-semibold ${compact ? 'text-sm' : 'text-base'}`}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

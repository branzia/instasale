import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, ViewStyle } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** 'default' = neutral gray pill (e.g. Sign Out). 'danger' = red text, no fill (e.g. Delete). */
  variant?: 'default' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  /** Smaller padding/type for a button sitting in a persistent bar (e.g. the
   * comment-builder's step action bar) rather than acting as a screen's one
   * big CTA. Default (false) is unchanged everywhere else. */
  compact?: boolean;
}

/**
 * Sibling to GradientButton for secondary/plain actions that previously
 * hand-rolled their own shell inline (Settings' Sign Out, both catalog
 * forms' Delete link) — a repeated shell, not a repeated interaction, so
 * this stays a thin presentational wrapper rather than adding variant props
 * to GradientButton itself.
 */
export default function SolidButton({ label, onPress, loading, disabled, variant = 'default', icon, style, compact }: Props) {
  const isDisabled = disabled || loading;
  const isDanger = variant === 'danger';

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: compact ? 6 : 8,
    paddingVertical: compact ? 10 : 16,
    ...(isDanger ? {} : { borderRadius: compact ? 12 : 16, backgroundColor: '#F3F4F6' }),
  };

  return (
    <Pressable onPress={onPress} disabled={isDisabled} style={[rowStyle, { opacity: isDisabled ? 0.6 : 1 }, style]}>
      {loading ? (
        <ActivityIndicator color={isDanger ? '#DC2626' : '#111827'} size={compact ? 'small' : undefined} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={compact ? 14 : 16} color={isDanger ? '#DC2626' : '#111827'} />}
          <Text className={`font-semibold ${isDanger ? 'text-red-600' : 'text-gray-900'} ${compact ? 'text-sm' : ''}`}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

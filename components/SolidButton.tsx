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
}

/**
 * Sibling to GradientButton for secondary/plain actions that previously
 * hand-rolled their own shell inline (Settings' Sign Out, both catalog
 * forms' Delete link) — a repeated shell, not a repeated interaction, so
 * this stays a thin presentational wrapper rather than adding variant props
 * to GradientButton itself.
 */
export default function SolidButton({ label, onPress, loading, disabled, variant = 'default', icon, style }: Props) {
  const isDisabled = disabled || loading;
  const isDanger = variant === 'danger';

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    ...(isDanger ? {} : { borderRadius: 16, backgroundColor: '#F3F4F6' }),
  };

  return (
    <Pressable onPress={onPress} disabled={isDisabled} style={[rowStyle, { opacity: isDisabled ? 0.6 : 1 }, style]}>
      {loading ? (
        <ActivityIndicator color={isDanger ? '#DC2626' : '#111827'} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={16} color={isDanger ? '#DC2626' : '#111827'} />}
          <Text className={`font-semibold ${isDanger ? 'text-red-600' : 'text-gray-900'}`}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

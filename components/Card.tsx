import { Pressable, View, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  /** Extra classes appended after the shared shell (e.g. `flex-row items-center`). */
  className?: string;
  style?: ViewStyle;
}

/**
 * Shared list-row/section shell (`bg-gray-50 rounded-2xl p-4 mb-3`) — the
 * single most-repeated visual pattern in the app (Posts, Automations,
 * Leads, Orders, Catalog rows, Settings sections). Only the outer shell is
 * shared; each screen keeps its own internal row layout since those differ
 * meaningfully (thumbnail+caption, key/value pairs, trailing status dot…).
 */
export default function Card({ children, onPress, className = '', style }: Props) {
  const shell = `bg-gray-50 rounded-2xl p-4 mb-3 ${className}`.trim();
  if (onPress) {
    return (
      <Pressable onPress={onPress} className={shell} style={style}>
        {children}
      </Pressable>
    );
  }
  return (
    <View className={shell} style={style}>
      {children}
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';
import { gradientShort, ui } from '@/config';

interface Option<T extends string> {
  value: T;
  label: string;
  /** 'tabs' variant only — outline/filled icon pairing, same convention as the bottom tab bar (app/(tabs)/_layout.tsx). */
  icon?: { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap };
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /**
   * 'pill' (default) — compact filter-style toggle, used by Catalog's
   * Products/Attributes screen, where the two options are really one list
   * viewed two ways. 'tabs' — full-width underline tab bar (icon + label,
   * active tab gets the accent color and a bottom indicator bar) for
   * screens that are genuinely two distinct top-level views rather than a
   * filter — e.g. Leads & Orders, which read as a filter toggle under the
   * 'pill' style even though they're separate resources with separate data.
   */
  variant?: 'pill' | 'tabs';
}

/**
 * Segmented control shared by Leads/Orders and Catalog's Products/
 * Attributes screens (previously two byte-identical local copies). Two
 * visual variants — see `variant` above — cover the two shapes those
 * screens actually are; Catalog keeps the original compact pill look
 * (its default) so this change doesn't touch that screen.
 */
export default function Segment<T extends string>({ options, value, onChange, variant = 'pill' }: Props<T>) {
  if (variant === 'tabs') {
    return (
      <View className="flex-row border-b border-gray-100">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable key={opt.value} onPress={() => onChange(opt.value)} className="flex-1 items-center pt-3 pb-2.5">
              <View className="flex-row items-center">
                {opt.icon && (
                  <Ionicons
                    name={active ? opt.icon.on : opt.icon.off}
                    size={16}
                    color={active ? ui.accent : ui.placeholderText}
                    style={{ marginRight: 6 }}
                  />
                )}
                <Text className="text-sm font-semibold" style={{ color: active ? ui.accent : '#6B7280' }}>
                  {opt.label}
                </Text>
              </View>
              <View className="mt-2 h-[3px] w-2/3 rounded-full" style={{ backgroundColor: active ? ui.accent : 'transparent' }} />
            </Pressable>
          );
        })}
      </View>
    );
  }

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

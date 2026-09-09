import { Text, View } from 'react-native';
import { statusColors } from '@/config';

interface Props {
  status: string;
  label: string;
}

/**
 * Pill badge reading its colors from config/colors.ts's shared `statusColors`
 * map — the single source of truth for both Lead/Order statuses (draft/
 * link_sent/confirmed/paid/expired) and Automation statuses (active/paused).
 * Replaces inline `style={{backgroundColor:...}}` badge JSX duplicated
 * between leads/index.tsx and leads/[id].tsx, and automations.tsx's own
 * local STATUS_STYLE map.
 */
export default function StatusBadge({ status, label }: Props) {
  const colors = statusColors[status] ?? statusColors.draft;
  return (
    <View className="self-start px-2.5 py-1 rounded-full" style={{ backgroundColor: colors.bg }}>
      <Text className="text-xs font-medium" style={{ color: colors.text }}>
        {label}
      </Text>
    </View>
  );
}

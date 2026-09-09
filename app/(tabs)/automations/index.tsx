import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import ScreenHeader from '@/components/ScreenHeader';
import StatusBadge from '@/components/StatusBadge';
import { ui } from '@/config';
import * as api from '@/services/api';
import { confirmDelete } from '@/utils/confirm';

type Automation = {
  id: number;
  type: 'comment' | 'dm';
  name: string;
  type_label: string;
  scope_label: string | null;
  is_all_media: boolean | null;
  media_id: string | null;
  trigger_label: string;
  status: 'draft' | 'active' | 'paused';
  executions_count: number;
};

type Summary = { total: number; active: number; paused: number; triggered: number };

const STATUS_LABEL: Record<string, string> = { active: 'Active', paused: 'Paused', draft: 'Draft' };

function SummaryTile({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number }) {
  return (
    <View className="bg-gray-50 rounded-2xl p-3 flex-1 mr-2 last:mr-0">
      <Ionicons name={icon} size={16} color={ui.accent} style={{ marginBottom: 4 }} />
      <Text className="text-xl font-bold text-gray-900">{value}</Text>
      <Text className="text-gray-500 text-xs mt-0.5">{label}</Text>
    </View>
  );
}

/** Where tapping an automation row opens — always by media id for a Comment automation (never its own id), exactly mirroring App\Filament\Instagram\Clusters\Automation\Pages\AllAutomations::editUrl(). */
function editRoute(item: Automation): string {
  if (item.type === 'dm') return `/automations/dm-builder?id=${item.id}`;
  const mediaId = item.is_all_media ? 'all' : (item.media_id ?? 'all');
  return `/automations/comment-builder?mediaId=${encodeURIComponent(mediaId)}`;
}

/**
 * "Automations" — list + summary (mirrors App\Filament\Instagram\Clusters\
 * Automation\Pages\AllAutomations) with full lifecycle: tap a row to edit,
 * Pause/Resume/Delete inline, "+" to start a new Smart Automation or DM Auto
 * Reply. The "Go Live" rule builders (comment-builder.tsx/dm-builder.tsx)
 * were web-only until this pass — see this screen's own git history / the
 * app's CLAUDE.md.
 */
export default function Automations() {
  const [items, setItems] = useState<Automation[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await api.getAutomations();
    if (res.status === 200) {
      setItems(res.data?.items ?? []);
      setSummary(res.data?.summary ?? null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggle = async (item: Automation) => {
    setBusyId(item.id);
    try {
      const res = item.status === 'active' ? await api.pauseAutomation(item.id) : await api.resumeAutomation(item.id);
      if (res.status === 200) {
        setItems((prev) => prev.map((a) => (a.id === item.id ? { ...a, status: res.data.status } : a)));
      } else if (res.status === 422) {
        Alert.alert("Can't resume yet", res.data?.message ?? 'Finish setting up this automation first.');
      }
    } finally {
      setBusyId(null);
    }
  };

  const remove = (item: Automation) =>
    confirmDelete('automation', async () => {
      setBusyId(item.id);
      try {
        const res = await api.deleteAutomation(item.id);
        if (res.status === 200) {
          setItems((prev) => prev.filter((a) => a.id !== item.id));
        }
      } finally {
        setBusyId(null);
      }
    });

  const createAutomation = () => {
    Alert.alert('Create Automation', 'Reply to comments, or reply to DMs?', [
      { text: 'Cancel', style: 'cancel' },
      // Smart Automation needs a post to attach to (or "Any post or reel") —
      // Posts & Reels already offers exactly that picker, mirroring
      // AllAutomations::createSmartUrl() routing into the post-choosing
      // page rather than a second, mostly-duplicate chooser screen here.
      { text: 'Smart Automation', onPress: () => router.push('/(tabs)/posts') },
      { text: 'DM Auto Reply', onPress: () => router.push('/automations/dm-builder') },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['top']}>
        <ActivityIndicator color={ui.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Automations" action={{ icon: 'add', onPress: createAutomation }} />

      {summary && (
        <View className="flex-row px-6 mb-4">
          <SummaryTile icon="layers-outline" label="Total" value={summary.total} />
          <SummaryTile icon="flash" label="Active" value={summary.active} />
          <SummaryTile icon="pause" label="Paused" value={summary.paused} />
          <SummaryTile icon="trending-up" label="Triggered" value={summary.triggered} />
        </View>
      )}

      {items.length === 0 ? (
        <EmptyState icon="flash-outline" title="No automations yet" body="Tap + to build your first Comment or DM automation." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui.accent} />}
          renderItem={({ item }) => {
            const canToggle = item.status === 'active' || item.status === 'paused';
            const busy = busyId === item.id;
            return (
              <Card onPress={() => router.push(editRoute(item))}>
                <View className="flex-row justify-between items-start mb-1">
                  <Text className="font-semibold text-gray-900 flex-1 mr-2" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <StatusBadge status={item.status} label={STATUS_LABEL[item.status] ?? item.status} />
                </View>
                <Text className="text-gray-500 text-xs mb-1">
                  {item.type_label}
                  {item.scope_label ? ` · ${item.scope_label}` : ''}
                </Text>
                <Text className="text-gray-600 text-sm mb-3" numberOfLines={1}>
                  {item.trigger_label}
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-400 text-xs">{item.executions_count} triggered</Text>
                  <View className="flex-row items-center gap-2">
                    {canToggle && (
                      <Pressable
                        onPress={() => toggle(item)}
                        disabled={busy}
                        className="flex-row items-center px-3 py-1.5 rounded-full bg-gray-200"
                      >
                        {!busy && (
                          <Ionicons
                            name={item.status === 'active' ? 'pause' : 'play'}
                            size={12}
                            color="#374151"
                            style={{ marginRight: 4 }}
                          />
                        )}
                        <Text className="text-xs font-semibold text-gray-700">
                          {busy ? '…' : item.status === 'active' ? 'Pause' : 'Resume'}
                        </Text>
                      </Pressable>
                    )}
                    <Pressable onPress={() => remove(item)} disabled={busy} className="p-1.5 rounded-full bg-red-50">
                      <Ionicons name="trash-outline" size={14} color="#DC2626" />
                    </Pressable>
                  </View>
                </View>
              </Card>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

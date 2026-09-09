import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import ScreenHeader from '@/components/ScreenHeader';
import { ui } from '@/config';
import * as api from '@/services/api';

type MediaItem = {
  id: string;
  media_type: string | null;
  caption: string | null;
  permalink: string | null;
  thumbnail_url: string | null;
  media_url: string | null;
  is_automated: boolean;
};

type Filter = 'all' | 'automated' | 'not_automated' | 'reels';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'automated', label: 'Automated' },
  { value: 'not_automated', label: 'Not automated' },
  { value: 'reels', label: 'Reels only' },
];

/**
 * "Posts & Reels" — mirrors App\Filament\Instagram\Pages\PostsReels: live
 * Graph API media, paginated via Meta's own cursor, an "Any post or reel"
 * account-wide entry card, All/Automated/Not automated/Reels-only filter
 * pills (client-side, over already-loaded $items — same as
 * PostsReels::filteredItems()/filterCounts()), and a per-item Ready to
 * Setup / Edit Automation button that always opens the Comment Automation
 * builder keyed by media id — never by an automation's own id, mirroring
 * media-card.blade.php's `$setupUrl` exactly (see automations/comment-
 * builder.tsx's docblock for why that matters).
 */
export default function Posts() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const loadFirstPage = useCallback(async () => {
    const res = await api.getInstagramMedia();
    if (res.status === 200) {
      setItems(res.data?.items ?? []);
      setNextCursor(res.data?.next_cursor ?? null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (items.length === 0) {
        setLoading(true);
        loadFirstPage().finally(() => setLoading(false));
      }
    }, [loadFirstPage]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const res = await api.getInstagramMedia(nextCursor);
    if (res.status === 200) {
      setItems((prev) => [...prev, ...(res.data?.items ?? [])]);
      setNextCursor(res.data?.next_cursor ?? null);
    }
    setLoadingMore(false);
  };

  const counts = useMemo(
    () => ({
      all: items.length,
      automated: items.filter((i) => i.is_automated).length,
      not_automated: items.filter((i) => !i.is_automated).length,
      reels: items.filter((i) => i.media_type === 'VIDEO').length,
    }),
    [items],
  );

  const visibleItems = useMemo(() => {
    switch (filter) {
      case 'automated':
        return items.filter((i) => i.is_automated);
      case 'not_automated':
        return items.filter((i) => !i.is_automated);
      case 'reels':
        return items.filter((i) => i.media_type === 'VIDEO');
      default:
        return items;
    }
  }, [items, filter]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['top']}>
        <ActivityIndicator color={ui.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Posts & Reels" />

      {items.length === 0 ? (
        <EmptyState
          icon="camera-outline"
          title="No posts yet"
          body="Connect Instagram from the web dashboard to see your posts and reels here."
        />
      ) : (
        <FlatList
          data={visibleItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui.accent} />}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          ListHeaderComponent={
            <View>
              <Pressable
                onPress={() => router.push('/automations/comment-builder?mediaId=all')}
                className="flex-row items-center bg-brand-50 rounded-2xl px-4 py-3.5 mb-3"
              >
                <View className="w-9 h-9 rounded-full bg-brand-500 items-center justify-center mr-3">
                  <Ionicons name="apps" size={16} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">Any post or reel</Text>
                  <Text className="text-gray-500 text-xs mt-0.5">One automation that covers every post — even future ones</Text>
                </View>
                <Text className="text-brand-600 font-semibold text-sm">Set up</Text>
              </Pressable>

              <View className="flex-row flex-wrap gap-2 mb-3">
                {FILTERS.map((f) => {
                  const active = filter === f.value;
                  return (
                    <Pressable
                      key={f.value}
                      onPress={() => setFilter(f.value)}
                      className={`px-3.5 py-1.5 rounded-full ${active ? 'bg-brand-500' : 'bg-gray-100'}`}
                    >
                      <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-gray-600'}`}>
                        {f.label} ({counts[f.value]})
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator color={ui.accent} className="my-4" /> : null}
          renderItem={({ item }) => (
            <Card className="flex-row">
              <Pressable onPress={() => item.permalink && Linking.openURL(item.permalink)}>
                {item.thumbnail_url ? (
                  <Image source={{ uri: item.thumbnail_url }} style={{ width: 64, height: 64, borderRadius: 12 }} />
                ) : (
                  <View style={{ width: 64, height: 64, borderRadius: 12 }} className="bg-gray-200 items-center justify-center">
                    <Ionicons name="image-outline" size={22} color={ui.placeholderText} />
                  </View>
                )}
              </Pressable>
              <View className="flex-1 ml-3 justify-center">
                <View className="flex-row items-center mb-1">
                  <View className="bg-gray-200 rounded-full px-2 py-0.5 mr-2">
                    <Text className="text-xs text-gray-600 font-medium">
                      {item.media_type === 'VIDEO' ? 'Reel' : 'Post'}
                    </Text>
                  </View>
                  <View className={`rounded-full px-2 py-0.5 ${item.is_automated ? 'bg-emerald-100' : 'bg-gray-200'}`}>
                    <Text className={`text-xs font-medium ${item.is_automated ? 'text-emerald-700' : 'text-gray-600'}`}>
                      {item.is_automated ? 'Automated' : 'Not automated'}
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-700 text-sm mb-2" numberOfLines={2}>
                  {item.caption || 'No caption'}
                </Text>
                <Pressable
                  onPress={() => router.push(`/automations/comment-builder?mediaId=${encodeURIComponent(item.id)}`)}
                  className={`self-start rounded-full px-3.5 py-1.5 ${item.is_automated ? 'bg-brand-50' : 'bg-brand-500'}`}
                >
                  <Text className={`text-xs font-semibold ${item.is_automated ? 'text-brand-600' : 'text-white'}`}>
                    {item.is_automated ? 'Edit Automation' : 'Ready to setup'}
                  </Text>
                </Pressable>
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

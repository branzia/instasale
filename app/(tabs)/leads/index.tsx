import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import ScreenHeader from '@/components/ScreenHeader';
import Segment from '@/components/Segment';
import StatusBadge from '@/components/StatusBadge';
import { ui } from '@/config';
import * as api from '@/services/api';

type Lead = {
  id: number;
  customer_name: string | null;
  product_name: string;
  qty: number;
  total: string;
  status: string;
  status_label: string;
  created_at: string;
};

type Order = {
  id: number;
  customer_name: string;
  product_name: string;
  total: string;
  payment_status: string;
  payment_gateway: string;
  created_at: string;
};

// Both segments load and paginate independently — each keeps its own items/
// cursor/total so switching Leads<->Orders shows already-fetched data
// instantly instead of blanking to a spinner every tap (see
// app/(tabs)/leads/index.tsx's history for why: it used to share one
// `loading` flag and re-fetch from scratch on every switch, which read as
// "loading a new page" rather than "flipping a tab"). `loaded` gates whether
// a segment has ever been fetched at all — only that first fetch shows the
// centered spinner; everything after is either instant (cached) or a small
// footer spinner (loading more / pull-to-refresh).
type SegmentState<T> = { items: T[]; nextCursor: number | null; total: number; loaded: boolean };

const emptySegment = <T,>(): SegmentState<T> => ({ items: [], nextCursor: null, total: 0, loaded: false });

export default function LeadsAndOrders() {
  // `?tab=orders` lets a deep link (e.g. the "New Order"/"Payment Received"
  // push notification's data.url, resolved by
  // services/notifications.ts#resolveNotificationRoute) land straight on
  // the Orders segment instead of always defaulting to Leads.
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [segment, setSegment] = useState<'leads' | 'orders'>(tab === 'orders' ? 'orders' : 'leads');
  const [leadsState, setLeadsState] = useState<SegmentState<Lead>>(emptySegment);
  const [ordersState, setOrdersState] = useState<SegmentState<Order>>(emptySegment);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // The initializer above only runs on first mount — but this screen stays
  // mounted while the merchant switches tabs, so a later notification tap
  // (`router.push('/(tabs)/leads?tab=orders')` while Leads is already
  // mounted) only changes `tab`, it doesn't remount the component. Watch
  // it explicitly so that case still jumps to Orders.
  useEffect(() => {
    if (tab === 'orders') setSegment('orders');
  }, [tab]);

  const loadLeadsFirstPage = useCallback(async () => {
    const res = await api.getLeads();
    if (res.status === 200) {
      setLeadsState({
        items: res.data?.leads ?? [],
        nextCursor: res.data?.next_cursor ?? null,
        total: res.data?.total ?? 0,
        loaded: true,
      });
    }
  }, []);

  const loadOrdersFirstPage = useCallback(async () => {
    const res = await api.getSalesOrders();
    if (res.status === 200) {
      setOrdersState({
        items: res.data?.orders ?? [],
        nextCursor: res.data?.next_cursor ?? null,
        total: res.data?.total ?? 0,
        loaded: true,
      });
    }
  }, []);

  // Fetch a segment the first time it's opened only — switching back to an
  // already-loaded segment reuses its cached state instead of re-fetching.
  useEffect(() => {
    if (segment === 'leads' && !leadsState.loaded) loadLeadsFirstPage();
    if (segment === 'orders' && !ordersState.loaded) loadOrdersFirstPage();
  }, [segment, leadsState.loaded, ordersState.loaded, loadLeadsFirstPage, loadOrdersFirstPage]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (segment === 'leads') await loadLeadsFirstPage();
    else await loadOrdersFirstPage();
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore) return;
    if (segment === 'leads') {
      if (!leadsState.nextCursor) return;
      setLoadingMore(true);
      const res = await api.getLeads(leadsState.nextCursor);
      if (res.status === 200) {
        setLeadsState((prev) => ({
          items: [...prev.items, ...(res.data?.leads ?? [])],
          nextCursor: res.data?.next_cursor ?? null,
          total: res.data?.total ?? prev.total,
          loaded: true,
        }));
      }
      setLoadingMore(false);
    } else {
      if (!ordersState.nextCursor) return;
      setLoadingMore(true);
      const res = await api.getSalesOrders(ordersState.nextCursor);
      if (res.status === 200) {
        setOrdersState((prev) => ({
          items: [...prev.items, ...(res.data?.orders ?? [])],
          nextCursor: res.data?.next_cursor ?? null,
          total: res.data?.total ?? prev.total,
          loaded: true,
        }));
      }
      setLoadingMore(false);
    }
  };

  const currentLoaded = segment === 'leads' ? leadsState.loaded : ordersState.loaded;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Leads & Orders" />
      <Segment
        variant="tabs"
        options={[
          {
            value: 'leads',
            label: leadsState.loaded ? `Leads (${leadsState.total})` : 'Leads',
            // Same outline/filled pairing as this screen's own bottom tab
            // bar icon (app/(tabs)/_layout.tsx's ICONS.leads).
            icon: { on: 'document-text', off: 'document-text-outline' },
          },
          {
            value: 'orders',
            label: ordersState.loaded ? `Orders (${ordersState.total})` : 'Orders',
            // Matches the Orders EmptyState icon below, for the same reason.
            icon: { on: 'cube', off: 'cube-outline' },
          },
        ]}
        value={segment}
        onChange={setSegment}
      />

      {!currentLoaded ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={ui.accent} />
        </View>
      ) : (
        <>
          {segment === 'leads' && leadsState.items.length === 0 && (
            <EmptyState icon="document-text-outline" title="No leads yet" body="Leads from your DM chatbot or dashboard will show up here." />
          )}
          {segment === 'orders' && ordersState.items.length === 0 && (
            <EmptyState icon="cube-outline" title="No orders yet" body="Your recent orders will show up here." />
          )}

          {segment === 'leads' && leadsState.items.length > 0 && (
            <FlatList
              data={leadsState.items}
              keyExtractor={(l) => String(l.id)}
              contentContainerStyle={{ padding: 12 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui.accent} />}
              onEndReachedThreshold={0.4}
              onEndReached={loadMore}
              ListFooterComponent={loadingMore ? <ActivityIndicator color={ui.accent} className="my-4" /> : null}
              renderItem={({ item }) => (
                <Card onPress={() => router.push(`/(tabs)/leads/${item.id}`)}>
                  <View className="flex-row justify-between items-start mb-1">
                    <Text className="font-semibold text-gray-900 flex-1 mr-2" numberOfLines={1}>
                      {item.customer_name || 'Unnamed lead'}
                    </Text>
                    {/* India-only for now, same as the rest of Lead to Sale's payment gateways. */}
                    <Text className="font-semibold text-gray-900">₹{item.total}</Text>
                  </View>
                  <Text className="text-gray-500 text-sm mb-2" numberOfLines={1}>
                    {item.product_name} · Qty {item.qty}
                  </Text>
                  <StatusBadge status={item.status} label={item.status_label} />
                </Card>
              )}
            />
          )}

          {segment === 'orders' && ordersState.items.length > 0 && (
            <FlatList
              data={ordersState.items}
              keyExtractor={(o) => String(o.id)}
              contentContainerStyle={{ padding: 12 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui.accent} />}
              onEndReachedThreshold={0.4}
              onEndReached={loadMore}
              ListFooterComponent={loadingMore ? <ActivityIndicator color={ui.accent} className="my-4" /> : null}
              renderItem={({ item }) => (
                <Card>
                  <View className="flex-row justify-between items-start mb-1">
                    <Text className="font-semibold text-gray-900 flex-1 mr-2" numberOfLines={1}>
                      {item.customer_name}
                    </Text>
                    <Text className="font-semibold text-gray-900">₹{item.total}</Text>
                  </View>
                  <Text className="text-gray-500 text-sm mb-2" numberOfLines={1}>
                    {item.product_name}
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons
                      name={item.payment_status === 'paid' ? 'checkmark-circle' : 'time-outline'}
                      size={13}
                      color={item.payment_status === 'paid' ? '#065F46' : '#92400E'}
                    />
                    <Text className="text-xs text-gray-500 ml-1">
                      {item.payment_status === 'paid' ? 'Paid' : 'Pending'} · {item.payment_gateway.toUpperCase()}
                    </Text>
                  </View>
                </Card>
              )}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

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

export default function LeadsAndOrders() {
  // `?tab=orders` lets a deep link (e.g. the "New Order"/"Payment Received"
  // push notification's data.url, resolved by
  // services/notifications.ts#resolveNotificationRoute) land straight on
  // the Orders segment instead of always defaulting to Leads.
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [segment, setSegment] = useState<'leads' | 'orders'>(tab === 'orders' ? 'orders' : 'leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // The initializer above only runs on first mount — but this screen stays
  // mounted while the merchant switches tabs, so a later notification tap
  // (`router.push('/(tabs)/leads?tab=orders')` while Leads is already
  // mounted) only changes `tab`, it doesn't remount the component. Watch
  // it explicitly so that case still jumps to Orders.
  useEffect(() => {
    if (tab === 'orders') setSegment('orders');
  }, [tab]);

  const load = useCallback(async (s: 'leads' | 'orders') => {
    if (s === 'leads') {
      const res = await api.getLeads();
      if (res.status === 200) setLeads(res.data?.leads ?? []);
    } else {
      const res = await api.getSalesOrders();
      if (res.status === 200) setOrders(res.data?.orders ?? []);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load(segment).finally(() => setLoading(false));
  }, [segment, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(segment);
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Leads & Orders" />
      <Segment
        options={[
          { value: 'leads', label: 'Leads' },
          { value: 'orders', label: 'Orders' },
        ]}
        value={segment}
        onChange={setSegment}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={ui.accent} />
        </View>
      ) : (
        <>
          {segment === 'leads' && leads.length === 0 && (
            <EmptyState icon="document-text-outline" title="No leads yet" body="Leads from your DM chatbot or dashboard will show up here." />
          )}
          {segment === 'orders' && orders.length === 0 && (
            <EmptyState icon="cube-outline" title="No orders yet" body="Confirmed and paid orders will show up here." />
          )}

          {segment === 'leads' && leads.length > 0 && (
            <FlatList
              data={leads}
              keyExtractor={(l) => String(l.id)}
              contentContainerStyle={{ padding: 12 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui.accent} />}
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

          {segment === 'orders' && orders.length > 0 && (
            <FlatList
              data={orders}
              keyExtractor={(o) => String(o.id)}
              contentContainerStyle={{ padding: 12 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui.accent} />}
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

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '@/components/Card';
import { gradientShort, ui } from '@/config';
import { useAuth } from '@/context/AuthContext';
import * as api from '@/services/api';

type RecentOrder = {
  id: number;
  customer_name: string;
  product_name: string;
  total: string;
  payment_status: string;
  payment_gateway: string;
};

function LinkRow({
  icon,
  title,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} className="flex-row items-center">
      <View className="w-11 h-11 rounded-full bg-brand-50 items-center justify-center mr-3">
        <Ionicons name={icon} size={20} color={ui.accent} />
      </View>
      <View className="flex-1 mr-2">
        <Text className="font-semibold text-gray-900 mb-0.5">{title}</Text>
        <Text className="text-gray-500 text-xs">{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={ui.placeholderText} />
    </Card>
  );
}

/**
 * Home — connection-status hero card (2026-09, explicit user call: no
 * stats/counters on the mobile dashboard — the old 4 StatCards backed by
 * Api\Instagram\DashboardController were removed along with that
 * controller) plus a "Recent Orders" widget (latest 5 from GET /orders,
 * same shape/row look as the Orders segment of the Leads+Orders tab), added
 * 2026-09-09 to fill what was otherwise dead space below the card.
 *
 * As of 2026-09-09's footer reduction (explicit user call: cut the tab bar
 * from 6 to 4 — see CLAUDE.md), the standalone Settings and Catalog tabs
 * are gone. Neither was inlined into this screen's scrollable body —
 * explicit user call: a destructive action (Disconnect Instagram, Sign
 * Out) sitting in a scrolling feed risks an accidental tap. Instead both
 * live one tap away, via the two `LinkRow`s just under the connection hero
 * — moved there from a bare icon pair in the header (also an explicit user
 * call: two unlabeled icons next to the name weren't discoverable, so each
 * now carries a title + one-line description of what it actually does).
 * This tab is a stack (see _layout.tsx) precisely so these can be pushed
 * screens (home/catalog.tsx, home/account-settings.tsx) rather than
 * sections here.
 *
 * Redesigned 2026-09-09: the connected state is the "everything's working"
 * happy path, so it gets the brand-gradient hero treatment (previously the
 * only screen with zero gradient use anywhere). A disconnected state stays
 * a flat amber warning card on purpose — a problem shouldn't look celebratory.
 */
export default function Home() {
  const { account, isInstagramConnected } = useAuth();
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!isInstagramConnected) {
        setLoadingOrders(false);
        return;
      }
      let cancelled = false;
      setLoadingOrders(true);
      api.getSalesOrders().then((res) => {
        if (cancelled) return;
        if (res.status === 200) setOrders((res.data?.orders ?? []).slice(0, 5));
        setLoadingOrders(false);
      });
      return () => {
        cancelled = true;
      };
    }, [isInstagramConnected]),
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView className="px-6 pt-4">
        <Text className="text-gray-400 text-sm">Welcome back</Text>
        <Text className="text-2xl font-bold text-gray-900 mb-6">{account?.name ?? 'there'} 👋</Text>

        {isInstagramConnected ? (
          <LinearGradient
            colors={gradientShort as unknown as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 20 }}
          >
            <View className="w-11 h-11 rounded-full bg-white/25 items-center justify-center mb-3">
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </View>
            <Text className="font-semibold text-white mb-1">Instagram Connected</Text>
            <Text className="text-sm text-white/90">
              You're all set — automations, leads, and orders are syncing normally.
            </Text>
          </LinearGradient>
        ) : (
          <View className="rounded-2xl p-5 bg-amber-50">
            <View className="w-11 h-11 rounded-full bg-amber-100 items-center justify-center mb-3">
              <Ionicons name="alert-circle" size={24} color="#92400E" />
            </View>
            <Text className="font-semibold text-amber-900 mb-1">Instagram Not Connected</Text>
            <Text className="text-sm text-amber-700">
              Connect your Instagram account from branzia.app/instagram to start receiving comments and DMs.
            </Text>
          </View>
        )}

        <View className="mt-6">
          <LinkRow
            icon="basket-outline"
            title="Catalog"
            description="Manage the products, pricing, bulk tiers, and buyer attributes your DM chatbot can sell."
            onPress={() => router.push('/(tabs)/home/catalog')}
          />
          <LinkRow
            icon="settings-outline"
            title="Settings"
            description="Account details, Instagram connection status, and sign out."
            onPress={() => router.push('/(tabs)/home/account-settings')}
          />
        </View>

        {isInstagramConnected && (
          <View className="mt-2 mb-10">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-gray-900">Recent Orders</Text>
              <Pressable onPress={() => router.push('/(tabs)/leads?tab=orders')}>
                <Text className="text-brand-500 text-sm font-semibold">View all</Text>
              </Pressable>
            </View>

            {loadingOrders ? (
              <ActivityIndicator color={ui.accent} style={{ marginTop: 12 }} />
            ) : orders.length === 0 ? (
              <Card>
                <Text className="text-gray-500 text-sm text-center">
                  No orders yet — your recent orders will show up here.
                </Text>
              </Card>
            ) : (
              orders.map((item) => (
                <Card key={item.id}>
                  <View className="flex-row justify-between items-start mb-1">
                    <Text className="font-semibold text-gray-900 flex-1 mr-2" numberOfLines={1}>
                      {item.customer_name}
                    </Text>
                    {/* India-only for now, same as the rest of Lead to Sale's payment gateways. */}
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
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DetailRow from '@/components/DetailRow';
import GradientButton from '@/components/GradientButton';
import ScreenHeader from '@/components/ScreenHeader';
import StatusBadge from '@/components/StatusBadge';
import { ui } from '@/config';
import * as api from '@/services/api';

type Lead = {
  id: number;
  customer_name: string | null;
  product_name: string;
  qty: number;
  price: string;
  delivery_charge: string;
  total: string;
  status: string;
  status_label: string;
  payment_url: string;
  created_at: string;
  sales_order: {
    payment_status: string;
    payment_gateway: string;
    customer_phone: string | null;
    customer_address: string | null;
    customer_city: string | null;
    customer_state: string | null;
    customer_pincode: string | null;
    buyer_notes: string | null;
  } | null;
};

export default function LeadDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLead(Number(id)).then((res) => {
      if (res.status === 200) setLead(res.data?.lead ?? null);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <ScreenHeader title="Lead" onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={ui.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!lead) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <ScreenHeader title="Lead" onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Lead not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const order = lead.sales_order;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScreenHeader title="Lead" onBack={() => router.back()} />
      <ScrollView className="px-5 pt-4">
        <View className="flex-row justify-between items-start mb-1">
          <Text className="text-2xl font-bold text-gray-900 flex-1 mr-2">
            {lead.customer_name || 'Unnamed lead'}
          </Text>
          <StatusBadge status={lead.status} label={lead.status_label} />
        </View>
        <Text className="text-gray-500 mb-6">{lead.product_name}</Text>

        <View className="bg-gray-50 rounded-2xl p-4 mb-4">
          <DetailRow label="Quantity" value={String(lead.qty)} />
          <DetailRow label="Unit Price" value={`₹${lead.price}`} />
          <DetailRow label="Delivery" value={`₹${lead.delivery_charge}`} />
          <View className="h-px bg-gray-200 my-1.5" />
          <DetailRow label="Total" value={`₹${lead.total}`} />
        </View>

        {order && (
          <View className="bg-gray-50 rounded-2xl p-4 mb-4">
            <Text className="text-gray-400 text-xs mb-2">ORDER DETAILS</Text>
            {order.customer_phone && <DetailRow label="Phone" value={order.customer_phone} />}
            {order.customer_address && (
              <DetailRow
                label="Address"
                value={[order.customer_address, order.customer_city, order.customer_state, order.customer_pincode]
                  .filter(Boolean)
                  .join(', ')}
              />
            )}
            <DetailRow label="Payment" value={`${order.payment_status} (${order.payment_gateway})`} />
            {order.buyer_notes && <DetailRow label="Notes" value={order.buyer_notes} />}
          </View>
        )}

        {!lead.sales_order?.payment_status || lead.sales_order.payment_status === 'pending' ? (
          <GradientButton
            label="Share Payment Link"
            onPress={() => Share.share({ message: lead.payment_url })}
            style={{ marginBottom: 24 }}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

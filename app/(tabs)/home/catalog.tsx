import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import ScreenHeader from '@/components/ScreenHeader';
import Segment from '@/components/Segment';
import { ui } from '@/config';
import * as api from '@/services/api';

type Product = {
  id: number;
  name: string;
  price: number | string;
  bulk_pricing: { min_qty: number; unit_price: number }[];
  is_available: boolean;
  attributes?: { label: string }[];
};

type Attribute = {
  id: number;
  name: string;
  values: string[];
  is_active: boolean;
};

/**
 * Catalog — Products & Attributes, full create/edit/delete, mirroring
 * App\Filament\Instagram\Resources\{ProductResource,AttributeResource}
 * exactly. Same shared Segment/EmptyState/Card as the Leads+Orders screen.
 *
 * Reached from Home's basket icon (2026-09-09 footer reduction — Catalog
 * lost its own tab; see home/index.tsx and CLAUDE.md's footer-reduction
 * note). Content is unchanged from the old catalog/ tab, just relocated —
 * product-form.tsx/attribute-form.tsx now live alongside this file.
 */
export default function Catalog() {
  const [segment, setSegment] = useState<'products' | 'attributes'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (s: 'products' | 'attributes') => {
    if (s === 'products') {
      const res = await api.getProducts();
      if (res.status === 200) setProducts(res.data?.products ?? []);
    } else {
      const res = await api.getAttributes();
      if (res.status === 200) setAttributes(res.data?.attributes ?? []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load(segment).finally(() => setLoading(false));
    }, [segment, load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load(segment);
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader
        title="Catalog"
        action={{
          icon: 'add',
          onPress: () => router.push(segment === 'products' ? '/(tabs)/home/product-form' : '/(tabs)/home/attribute-form'),
        }}
      />

      <Segment
        variant="tabs"
        options={[
          // Icons match this screen's own EmptyState icons below, same
          // reasoning as the Leads & Orders tab bar (app/(tabs)/leads/index.tsx).
          { value: 'products', label: 'Products', icon: { on: 'basket', off: 'basket-outline' } },
          { value: 'attributes', label: 'Attributes', icon: { on: 'pricetag', off: 'pricetag-outline' } },
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
          {segment === 'products' && products.length === 0 && (
            <EmptyState icon="basket-outline" title="No products yet" body="Add a product so your DM chatbot can sell it." />
          )}
          {segment === 'attributes' && attributes.length === 0 && (
            <EmptyState
              icon="pricetag-outline"
              title="No attributes yet"
              body="Attributes are reusable option lists (size, color, flavor…) you can attach to products."
            />
          )}

          {segment === 'products' && products.length > 0 && (
            <FlatList
              data={products}
              keyExtractor={(p) => String(p.id)}
              contentContainerStyle={{ padding: 12 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui.accent} />}
              renderItem={({ item }) => (
                <Card onPress={() => router.push(`/(tabs)/home/product-form?id=${item.id}`)} className="flex-row justify-between items-center">
                  <View className="flex-1 mr-2">
                    <Text className="font-semibold text-gray-900" numberOfLines={1}>{item.name}</Text>
                    {(item.bulk_pricing?.length > 0 || (item.attributes?.length ?? 0) > 0) && (
                      <Text className="text-gray-400 text-xs mt-0.5">
                        {[
                          item.bulk_pricing?.length > 0 ? `${item.bulk_pricing.length} bulk tier(s)` : null,
                          (item.attributes?.length ?? 0) > 0 ? `${item.attributes!.length} attribute(s)` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    )}
                  </View>
                  <Text className="font-semibold text-gray-900 mr-2">₹{item.price}</Text>
                  <View className={`w-2 h-2 rounded-full ${item.is_available ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                </Card>
              )}
            />
          )}

          {segment === 'attributes' && attributes.length > 0 && (
            <FlatList
              data={attributes}
              keyExtractor={(a) => String(a.id)}
              contentContainerStyle={{ padding: 12 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui.accent} />}
              renderItem={({ item }) => (
                <Card onPress={() => router.push(`/(tabs)/home/attribute-form?id=${item.id}`)} className="flex-row justify-between items-center">
                  <View className="flex-1 mr-2">
                    <Text className="font-semibold text-gray-900" numberOfLines={1}>{item.name}</Text>
                    <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={1}>
                      {item.values?.join(', ') || '—'}
                    </Text>
                  </View>
                  <View className={`w-2 h-2 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                </Card>
              )}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

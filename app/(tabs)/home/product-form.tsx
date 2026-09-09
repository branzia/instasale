import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Checkbox from '@/components/Checkbox';
import GradientButton from '@/components/GradientButton';
import ProductAttributeCard, { attrFromPredefined, blankCustomAttr, ProductAttr } from '@/components/ProductAttributeCard';
import SolidButton from '@/components/SolidButton';
import { ui } from '@/config';
import * as api from '@/services/api';
import { confirmDelete } from '@/utils/confirm';

type BulkTier = { min_qty: string; unit_price: string };
type PredefinedAttribute = { id: number; name: string; values: string[]; is_active: boolean };

let keyCounter = 0;
const nextKey = () => `attr-${Date.now()}-${keyCounter++}`;

function attrsFromServer(raw: any[]): ProductAttr[] {
  return (raw ?? []).map((a) => ({
    _key: nextKey(),
    source: a.source === 'predefined' ? 'predefined' : 'custom',
    predefined_id: a.predefined_id ?? null,
    label: a.label ?? '',
    required: !!a.required,
    values: (a.values ?? []).map((v: any) => ({ label: v.label ?? '', price: String(v.price ?? 0) })),
  }));
}

function attrsToPayload(attrs: ProductAttr[]) {
  return attrs.map((a) => ({
    source: a.source,
    predefined_id: a.predefined_id,
    label: a.label,
    required: a.required,
    values: a.values.map((v) => ({ label: v.label, price: v.price === '' ? 0 : Number(v.price) || 0 })),
  }));
}

/**
 * Create/edit a Catalog product — mirrors
 * App\Filament\Instagram\Clusters\LeadToSale\Resources\ProductResource's
 * form (name, price, bulk pricing, is_available) plus its Attributes
 * builder (`_attributes.blade.php`, added here 2026-09 — see
 * components/ProductAttributeCard.tsx). `?id=` present means edit.
 *
 * Lives under home/ (moved from the now-removed catalog/ tab, 2026-09-09
 * footer reduction — Catalog is reached from Home's basket icon now, see
 * home/index.tsx, home/catalog.tsx, and CLAUDE.md).
 */
export default function ProductForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [tiers, setTiers] = useState<BulkTier[]>([]);
  const [attributes, setAttributes] = useState<ProductAttr[]>([]);
  const [predefined, setPredefined] = useState<PredefinedAttribute[]>([]);

  useEffect(() => {
    (async () => {
      const [attrsRes, productsRes] = await Promise.all([api.getAttributes(), isEdit ? api.getProducts() : Promise.resolve(null)]);
      if (attrsRes.status === 200) setPredefined((attrsRes.data?.attributes ?? []).filter((a: PredefinedAttribute) => a.is_active));

      if (isEdit && productsRes?.status === 200) {
        const product = (productsRes.data?.products ?? []).find((p: any) => String(p.id) === id);
        if (product) {
          setName(product.name);
          setPrice(String(product.price));
          setIsAvailable(!!product.is_available);
          setTiers((product.bulk_pricing ?? []).map((t: any) => ({ min_qty: String(t.min_qty), unit_price: String(t.unit_price) })));
          setAttributes(attrsFromServer(product.attributes ?? []));
        }
      }
      setLoading(false);
    })();
  }, [id]);

  const addTier = () => setTiers((prev) => [...prev, { min_qty: '', unit_price: '' }]);
  const removeTier = (i: number) => setTiers((prev) => prev.filter((_, idx) => idx !== i));
  const updateTier = (i: number, field: keyof BulkTier, value: string) =>
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));

  const isPredefinedAdded = (predefinedId: number) => attributes.some((a) => a.predefined_id === predefinedId);
  const addPredefinedAttr = (pre: PredefinedAttribute) => {
    if (isPredefinedAdded(pre.id)) return;
    setAttributes((prev) => [...prev, attrFromPredefined(nextKey(), pre.id, pre.name, pre.values)]);
  };
  const addCustomAttr = () => setAttributes((prev) => [...prev, blankCustomAttr(nextKey())]);
  const patchAttr = (key: string, patch: Partial<ProductAttr>) =>
    setAttributes((prev) => prev.map((a) => (a._key === key ? { ...a, ...patch } : a)));
  const removeAttr = (key: string) => setAttributes((prev) => prev.filter((a) => a._key !== key));

  const save = async () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert('Missing info', 'Enter a name and price.');
      return;
    }
    const bulk_pricing = tiers
      .filter((t) => t.min_qty.trim() && t.unit_price.trim())
      .map((t) => ({ min_qty: Number(t.min_qty), unit_price: Number(t.unit_price) }));

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        price: Number(price),
        bulk_pricing,
        is_available: isAvailable,
        attributes: attrsToPayload(attributes),
      };
      const res = isEdit ? await api.updateProduct(Number(id), payload) : await api.createProduct(payload);
      if (res.status === 200 || res.status === 201) {
        router.back();
        return;
      }
      Alert.alert('Could not save', res.data?.message ?? 'Check the form and try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = () =>
    confirmDelete('product', async () => {
      setDeleting(true);
      try {
        const res = await api.deleteProduct(Number(id));
        if (res.status === 200) router.back();
      } finally {
        setDeleting(false);
      }
    });

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color={ui.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <ScrollView className="px-6 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-gray-700 mb-2 font-medium">Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Chocolate Truffle Box"
          placeholderTextColor={ui.placeholderText}
          className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-900 mb-4"
        />

        <Text className="text-gray-700 mb-2 font-medium">Price</Text>
        <TextInput
          value={price}
          onChangeText={setPrice}
          placeholder="0"
          placeholderTextColor={ui.placeholderText}
          keyboardType="decimal-pad"
          className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-900 mb-4"
        />

        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-700 font-medium">Bulk Pricing (optional)</Text>
          <Pressable onPress={addTier}>
            <Text className="text-brand-500 font-medium">+ Add Tier</Text>
          </Pressable>
        </View>
        {tiers.map((tier, i) => (
          <View key={i} className="flex-row items-center gap-2 mb-2">
            <TextInput
              value={tier.min_qty}
              onChangeText={(v) => updateTier(i, 'min_qty', v)}
              placeholder="Qty and above"
              placeholderTextColor={ui.placeholderText}
              keyboardType="number-pad"
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-gray-900 flex-1"
            />
            <TextInput
              value={tier.unit_price}
              onChangeText={(v) => updateTier(i, 'unit_price', v)}
              placeholder="Price per unit"
              placeholderTextColor={ui.placeholderText}
              keyboardType="decimal-pad"
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-gray-900 flex-1"
            />
            <Pressable onPress={() => removeTier(i)} className="px-2">
              <Ionicons name="close" size={18} color="#EF4444" />
            </Pressable>
          </View>
        ))}

        <View className="mt-2 mb-6">
          <Checkbox checked={isAvailable} onToggle={() => setIsAvailable((v) => !v)} label="Available" />
        </View>

        <Text className="text-gray-900 font-semibold mb-1">Product Attributes</Text>
        <Text className="text-gray-500 text-xs mb-3">Let buyers choose options (size, flavor, color) before this product is added to an order.</Text>

        {attributes.length === 0 && (
          <Text className="text-gray-400 text-sm text-center py-4 mb-2">No attributes yet. Add options using the buttons below.</Text>
        )}

        {attributes.map((attr) => (
          <ProductAttributeCard
            key={attr._key}
            attr={attr}
            onChange={(patch) => patchAttr(attr._key, patch)}
            onRemove={() => removeAttr(attr._key)}
          />
        ))}

        <View className="flex-row flex-wrap gap-2 mb-8">
          {predefined.map((pre) => {
            const added = isPredefinedAdded(pre.id);
            return (
              <Pressable
                key={pre.id}
                onPress={() => addPredefinedAttr(pre)}
                disabled={added}
                className={`flex-row items-center rounded-full border px-3 py-1.5 ${added ? 'border-gray-200 bg-gray-100 opacity-50' : 'border-gray-300 bg-white'}`}
              >
                <Text className="text-gray-700 text-sm mr-1">+</Text>
                <Text className="text-gray-700 text-sm">{pre.name}</Text>
              </Pressable>
            );
          })}
          <Pressable onPress={addCustomAttr} className="flex-row items-center rounded-full bg-brand-500 px-3 py-1.5">
            <Text className="text-white text-sm font-medium mr-1">+</Text>
            <Text className="text-white text-sm font-medium">Custom Attribute</Text>
          </Pressable>
        </View>

        <GradientButton label={isEdit ? 'Save Changes' : 'Add Product'} onPress={save} loading={saving} />

        {isEdit && (
          <View className="mt-2">
            <SolidButton label="Delete Product" variant="danger" disabled={deleting} loading={deleting} onPress={remove} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

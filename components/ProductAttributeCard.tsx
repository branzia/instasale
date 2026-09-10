import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import Checkbox from '@/components/Checkbox';
import { ui } from '@/config';

export type AttrValue = { label: string; price: string };

export type ProductAttr = {
  _key: string;
  source: 'predefined' | 'custom';
  predefined_id: number | null;
  label: string;
  required: boolean;
  values: AttrValue[];
};

export function attrFromPredefined(key: string, predefinedId: number, name: string, values: string[]): ProductAttr {
  return {
    _key: key,
    source: 'predefined',
    predefined_id: predefinedId,
    label: name,
    required: false,
    values: values.map((v) => ({ label: v, price: '0' })),
  };
}

export function blankCustomAttr(key: string): ProductAttr {
  return {
    _key: key,
    source: 'custom',
    predefined_id: null,
    label: '',
    required: false,
    values: [{ label: '', price: '0' }],
  };
}

interface Props {
  attr: ProductAttr;
  onChange: (patch: Partial<ProductAttr>) => void;
  onRemove: () => void;
}

/**
 * One "Product Attributes" card — mirrors
 * resources/views/filament/instagram/resources/product-resource/pages/
 * _attributes.blade.php's Alpine component exactly: a question label
 * (editable regardless of source, just prefilled from the reusable
 * attribute's name when added via a "+ {name}" button), Required, and a
 * list of option/price rows with a "Default price" checkbox that zeroes
 * and disables the price input — same UX as the web builder's
 * `val.price === 0` convention.
 */
export default function ProductAttributeCard({ attr, onChange, onRemove }: Props) {
  const updateValue = (i: number, patch: Partial<AttrValue>) =>
    onChange({ values: attr.values.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) });

  const addValue = () => onChange({ values: [...attr.values, { label: '', price: '0' }] });
  const removeValue = (i: number) => onChange({ values: attr.values.filter((_, idx) => idx !== i) });

  return (
    <View className="bg-gray-50 rounded-2xl p-4 mb-3">
      <View className="flex-row items-end gap-2 mb-2">
        <View className="flex-1">
          <Text className="text-xs font-medium text-gray-600 mb-1">
            Question for buyer{attr.required ? ' *' : ''}
          </Text>
          <TextInput
            value={attr.label}
            onChangeText={(v) => onChange({ label: v })}
            placeholder="e.g. What size?"
            placeholderTextColor={ui.placeholderText}
            className="bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-gray-900"
          />
        </View>
        <Pressable onPress={onRemove} className="p-2.5" hitSlop={6}>
          <Ionicons name="trash-outline" size={16} color="#DC2626" />
        </Pressable>
      </View>

      <View className="mb-3">
        <Checkbox checked={attr.required} onToggle={() => onChange({ required: !attr.required })} label="Required" />
      </View>

      <Text className="text-xs font-medium text-gray-600 mb-2">Options & prices</Text>
      {attr.values.map((val, i) => {
        const isDefault = val.price === '0';
        return (
          <View key={i} className="flex-row items-center gap-2 mb-2">
            <TextInput
              value={val.label}
              onChangeText={(v) => updateValue(i, { label: v })}
              placeholder="Option label (e.g. Small, Large)"
              placeholderTextColor={ui.placeholderText}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 flex-1"
            />
            <Pressable onPress={() => updateValue(i, { price: isDefault ? '' : '0' })} hitSlop={4} className="mr-1">
              <View className={`w-5 h-5 rounded items-center justify-center ${isDefault ? 'bg-brand-500' : 'bg-white border border-gray-300'}`}>
                {isDefault && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
            </Pressable>
            {!isDefault && (
              <TextInput
                value={val.price}
                onChangeText={(v) => updateValue(i, { price: v.replace(/[^0-9.]/g, '') })}
                placeholder="0"
                placeholderTextColor={ui.placeholderText}
                keyboardType="decimal-pad"
                className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 w-20 mr-1"
              />
            )}
            <Pressable onPress={() => removeValue(i)} hitSlop={4} className="ml-1">
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          </View>
        );
      })}
      <Pressable onPress={addValue} className="mt-1">
        <Text className="text-brand-500 text-sm font-medium">+ Add option</Text>
      </Pressable>
    </View>
  );
}

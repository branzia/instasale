import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Checkbox from '@/components/Checkbox';
import GradientButton from '@/components/GradientButton';
import ScreenHeader from '@/components/ScreenHeader';
import SolidButton from '@/components/SolidButton';
import { ui } from '@/config';
import * as api from '@/services/api';
import { confirmDelete } from '@/utils/confirm';

/**
 * Create/edit a Catalog attribute — mirrors AttributeResource's form (name,
 * values, is_active) exactly. `?id=` present means edit.
 *
 * Lives under home/ (moved from the now-removed catalog/ tab, 2026-09-09
 * footer reduction — Catalog is reached from Home's basket icon now, see
 * home/index.tsx, home/catalog.tsx, and CLAUDE.md).
 */
export default function AttributeForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [values, setValues] = useState<string[]>([]);
  const [valueInput, setValueInput] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const res = await api.getAttributes();
      if (res.status === 200) {
        const attribute = (res.data?.attributes ?? []).find((a: any) => String(a.id) === id);
        if (attribute) {
          setName(attribute.name);
          setIsActive(!!attribute.is_active);
          setValues(attribute.values ?? []);
        }
      }
      setLoading(false);
    })();
  }, [id]);

  const addValue = () => {
    const trimmed = valueInput.trim();
    if (!trimmed || values.includes(trimmed)) {
      setValueInput('');
      return;
    }
    setValues((prev) => [...prev, trimmed]);
    setValueInput('');
  };

  const removeValue = (v: string) => setValues((prev) => prev.filter((x) => x !== v));

  const save = async () => {
    if (!name.trim() || values.length === 0) {
      Alert.alert('Missing info', 'Enter a name and at least one option.');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: name.trim(), values, is_active: isActive };
      const res = isEdit ? await api.updateAttribute(Number(id), payload) : await api.createAttribute(payload);
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
    confirmDelete('attribute', async () => {
      setDeleting(true);
      try {
        const res = await api.deleteAttribute(Number(id));
        if (res.status === 200) router.back();
      } finally {
        setDeleting(false);
      }
    });

  const title = isEdit ? 'Edit Attribute' : 'Add Attribute';

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <ScreenHeader title={title} onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={ui.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title={title} onBack={() => router.back()} />
      <ScrollView className="px-6 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-gray-700 mb-2 font-medium">Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Size"
          placeholderTextColor={ui.placeholderText}
          className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-900 mb-4"
        />

        <Text className="text-gray-700 mb-2 font-medium">Options</Text>
        <View className="flex-row items-center gap-2 mb-3">
          <TextInput
            value={valueInput}
            onChangeText={setValueInput}
            onSubmitEditing={addValue}
            placeholder="Type an option and press Add"
            placeholderTextColor={ui.placeholderText}
            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-900 flex-1"
          />
          <Pressable onPress={addValue} className="bg-gray-100 rounded-2xl px-4 py-3.5">
            <Text className="text-gray-700 font-medium">Add</Text>
          </Pressable>
        </View>

        <View className="flex-row flex-wrap gap-2 mb-6">
          {values.map((v) => (
            <Pressable key={v} onPress={() => removeValue(v)} className="bg-brand-50 rounded-full pl-3 pr-2 py-1.5 flex-row items-center">
              <Text className="text-brand-700 text-sm font-medium mr-1">{v}</Text>
              <Ionicons name="close" size={14} color={ui.accent} />
            </Pressable>
          ))}
        </View>

        <View className="mb-8">
          <Checkbox checked={isActive} onToggle={() => setIsActive((v) => !v)} label="Active" />
        </View>

        <GradientButton label={isEdit ? 'Save Changes' : 'Add Attribute'} onPress={save} loading={saving} />

        {isEdit && (
          <View className="mt-2">
            <SolidButton label="Delete Attribute" variant="danger" disabled={deleting} loading={deleting} onPress={remove} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

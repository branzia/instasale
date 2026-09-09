import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '@/components/GradientButton';
import SolidButton from '@/components/SolidButton';
import { ui } from '@/config';
import * as api from '@/services/api';
import { confirmDelete } from '@/utils/confirm';

type TriggerMode = 'keywords' | 'any';

/**
 * "Create Auto-Reply" / "Edit Automation" — mirrors
 * App\Filament\Instagram\Clusters\Automation\Pages\DmAutomationBuilder:
 * Trigger (keywords vs. the single "Any Message" fallback) → Message text,
 * plus a Name field. No post/media scope, no Card Message, no Send Delay —
 * DmAutomationExecutor doesn't implement either, same as the web builder.
 */
export default function DmBuilder() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState<'draft' | 'live' | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState('');
  const [triggerMode, setTriggerMode] = useState<TriggerMode>('keywords');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const res = await api.getAutomation(Number(id));
      if (res.status === 200 && res.data?.type === 'dm') {
        setName(res.data.name ?? '');
        setTriggerMode(res.data.trigger_mode === 'any' ? 'any' : 'keywords');
        setKeywords(res.data.keywords ?? []);
        setMessageText(res.data.message_text ?? '');
      } else {
        Alert.alert('Unavailable', "Couldn't open this automation.");
        router.back();
      }
      setLoading(false);
    })();
  }, [id]);

  const addKeyword = () => {
    const pieces = newKeyword
      .split(/[,\n]/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (pieces.length === 0) return;
    const seen = new Set(keywords.map((k) => k.toLowerCase()));
    const next = [...keywords];
    for (const p of pieces) {
      if (!seen.has(p.toLowerCase())) {
        seen.add(p.toLowerCase());
        next.push(p);
      }
    }
    setKeywords(next);
    setNewKeyword('');
  };

  const removeKeyword = (i: number) => setKeywords((prev) => prev.filter((_, idx) => idx !== i));

  const save = async (status: 'draft' | 'active') => {
    setSaving(status === 'active' ? 'live' : 'draft');
    try {
      const res = await api.saveAutomation({
        type: 'dm',
        id: isEdit ? Number(id) : undefined,
        status,
        name,
        trigger_mode: triggerMode,
        keywords,
        message_text: messageText,
      });
      if (res.status === 200) {
        if (status === 'draft') {
          Alert.alert('Draft saved');
          if (!isEdit) router.replace(`/automations/dm-builder?id=${res.data.automation_id}`);
        } else {
          router.back();
        }
        return;
      }
      if (res.status === 422 && res.data?.blockers) {
        Alert.alert('A few things are missing', res.data.blockers.join('\n'));
      } else {
        Alert.alert("Couldn't save", res.data?.message ?? 'Please try again.');
      }
    } finally {
      setSaving(null);
    }
  };

  const remove = () =>
    confirmDelete('automation', async () => {
      setDeleting(true);
      try {
        const res = await api.deleteAutomation(Number(id));
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
          placeholder="e.g. Price DM"
          placeholderTextColor={ui.placeholderText}
          className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-900 mb-5"
        />

        <Text className="text-gray-700 mb-2 font-medium">Trigger</Text>
        <View className="flex-row gap-2 mb-4">
          <Pressable
            onPress={() => setTriggerMode('keywords')}
            className={`flex-1 rounded-2xl px-4 py-3.5 border ${triggerMode === 'keywords' ? 'bg-brand-50 border-brand-500' : 'bg-white border-gray-200'}`}
          >
            <Text className={`font-semibold ${triggerMode === 'keywords' ? 'text-brand-600' : 'text-gray-700'}`}>Specific keywords</Text>
          </Pressable>
          <Pressable
            onPress={() => setTriggerMode('any')}
            className={`flex-1 rounded-2xl px-4 py-3.5 border ${triggerMode === 'any' ? 'bg-brand-50 border-brand-500' : 'bg-white border-gray-200'}`}
          >
            <Text className={`font-semibold ${triggerMode === 'any' ? 'text-brand-600' : 'text-gray-700'}`}>Any message</Text>
          </Pressable>
        </View>

        {triggerMode === 'keywords' && (
          <>
            <View className="flex-row flex-wrap gap-1.5 mb-2">
              {keywords.map((k, i) => (
                <View key={`${k}-${i}`} className="flex-row items-center bg-gray-50 border border-gray-200 rounded-full pl-3 pr-1.5 py-1">
                  <Text className="text-gray-700 text-xs mr-1">{k}</Text>
                  <Pressable onPress={() => removeKeyword(i)} hitSlop={6}>
                    <Ionicons name="close-circle" size={14} color="#9CA3AF" />
                  </Pressable>
                </View>
              ))}
            </View>
            <View className="flex-row gap-2 mb-5">
              <TextInput
                value={newKeyword}
                onChangeText={setNewKeyword}
                onSubmitEditing={addKeyword}
                placeholder="Add a keyword, then Enter"
                placeholderTextColor={ui.placeholderText}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-gray-900 flex-1"
              />
              <Pressable onPress={addKeyword} className="bg-brand-500 rounded-xl px-4 items-center justify-center">
                <Ionicons name="add" size={18} color="#fff" />
              </Pressable>
            </View>
          </>
        )}

        <Text className="text-gray-700 mb-2 font-medium">Reply message</Text>
        <TextInput
          value={messageText}
          onChangeText={setMessageText}
          placeholder="What should this automation reply with?"
          placeholderTextColor={ui.placeholderText}
          multiline
          className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-900 mb-6 min-h-[100px]"
        />

        <GradientButton label="Go Live" onPress={() => save('active')} loading={saving === 'live'} disabled={saving !== null} />
        <View className="mt-2">
          <SolidButton label="Save Draft" onPress={() => save('draft')} loading={saving === 'draft'} disabled={saving !== null} />
        </View>
        {isEdit && (
          <View className="mt-2">
            <SolidButton label="Delete Automation" variant="danger" onPress={remove} loading={deleting} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

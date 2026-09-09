import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Checkbox from '@/components/Checkbox';
import GradientButton from '@/components/GradientButton';
import RuleCard, { blankRule, RuleState } from '@/components/RuleCard';
import Segment from '@/components/Segment';
import SolidButton from '@/components/SolidButton';
import { ui } from '@/config';
import * as api from '@/services/api';
import { confirmDelete } from '@/utils/confirm';

type Step = 'setup' | 'rules' | 'product' | 'advanced';
type Scope = 'specific_media' | 'all_media';

type Media = {
  id: string;
  media_type: string | null;
  caption: string | null;
  permalink: string | null;
  thumbnail_url: string | null;
  media_url: string | null;
};

type Product = { id: number; name: string; price: number };

type ScopeState = {
  automationId: number | null;
  status: string;
  rules: RuleState[];
  anyFallback: RuleState | null;
  oncePerUser: boolean;
  delayEnabled: boolean;
  delaySeconds: number;
  productId: number | null;
};

function emptyScopeState(): ScopeState {
  return { automationId: null, status: 'draft', rules: [], anyFallback: null, oncePerUser: true, delayEnabled: false, delaySeconds: 30, productId: null };
}

function ruleFromServer(r: any, isFallback: boolean, key: string): RuleState {
  return {
    _key: key,
    id: r.id ?? null,
    name: isFallback ? '' : (r.name ?? ''),
    keywords: isFallback ? [] : (r.keywords ?? []),
    newKeyword: '',
    public_reply_enabled: !!r.public_reply_enabled,
    public_reply_text: r.public_reply_text ?? '',
    dm_enabled: !!r.dm_enabled,
    dm_text: r.dm_text ?? '',
    dm_mode: r.dm_mode ?? 'custom',
    dm_card_image_path: r.dm_card_image_path ?? null,
    dm_card_image_url: r.dm_card_image_url ?? null,
    dm_card_headline: r.dm_card_headline ?? '',
    dm_card_description: r.dm_card_description ?? '',
    dm_card_button_label: r.dm_card_button_label ?? '',
    dm_card_button_url: r.dm_card_button_url ?? '',
    enabled: r.enabled ?? true,
  };
}

function scopeStateFromServer(s: any): ScopeState {
  let i = 0;
  return {
    automationId: s.automation_id ?? null,
    status: s.status ?? 'draft',
    rules: (s.rules ?? []).map((r: any) => ruleFromServer(r, false, `srv-${i++}`)),
    anyFallback: s.any_fallback ? ruleFromServer(s.any_fallback, true, 'fallback') : null,
    oncePerUser: s.once_per_user ?? true,
    delayEnabled: s.delay_enabled ?? false,
    delaySeconds: s.delay_seconds ?? 30,
    productId: s.product_id ?? null,
  };
}

function ruleToPayload(r: RuleState, withNameKeywords: boolean) {
  const base: Record<string, unknown> = {
    id: r.id,
    public_reply_enabled: r.public_reply_enabled,
    public_reply_text: r.public_reply_text,
    dm_enabled: r.dm_enabled,
    dm_text: r.dm_text,
    dm_mode: r.dm_mode,
    dm_card_image_path: r.dm_card_image_path,
    dm_card_headline: r.dm_card_headline,
    dm_card_description: r.dm_card_description,
    dm_card_button_label: r.dm_card_button_label,
    dm_card_button_url: r.dm_card_button_url,
    enabled: r.enabled,
  };
  if (withNameKeywords) {
    base.name = r.name;
    base.keywords = r.keywords;
  }
  return base;
}

const STEPS: { value: Step; label: string }[] = [
  { value: 'setup', label: 'Setup' },
  { value: 'rules', label: 'Rules' },
  { value: 'product', label: 'Product' },
  { value: 'advanced', label: 'Advanced' },
];

/**
 * "Setup Comment Automation" — mirrors App\Filament\Instagram\Pages\
 * AutomationSetup exactly: hydrates via GET /automations/setup/{mediaId}
 * (mediaId is a real Instagram media id, or 'all' for the account-wide entry
 * point), keeps BOTH scope snapshots in memory so switching Setup → Post
 * scope never loses in-progress edits, and saves via POST /automations
 * (type: comment) for both Save Draft and Go Live.
 */
export default function CommentBuilder() {
  const { mediaId } = useLocalSearchParams<{ mediaId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'draft' | 'live' | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [step, setStep] = useState<Step>('setup');

  const [media, setMedia] = useState<Media | null>(null);
  const [hasConcreteMedia, setHasConcreteMedia] = useState(false);
  const [scope, setScope] = useState<Scope>('specific_media');
  const [snapshots, setSnapshots] = useState<Record<Scope, ScopeState>>({
    specific_media: emptyScopeState(),
    all_media: emptyScopeState(),
  });

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [fallbackExpanded, setFallbackExpanded] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);

  const state = snapshots[scope];
  const setState = (patch: Partial<ScopeState>) => setSnapshots((prev) => ({ ...prev, [scope]: { ...prev[scope], ...patch } }));

  useEffect(() => {
    (async () => {
      const [setupRes, productsRes] = await Promise.all([api.getAutomationSetup(mediaId), api.getProducts()]);
      if (setupRes.status === 200) {
        const d = setupRes.data;
        setMedia(d.media ?? null);
        setHasConcreteMedia(!!d.has_concrete_media);
        setScope(d.default_scope === 'all_media' ? 'all_media' : 'specific_media');
        setSnapshots({
          specific_media: d.scope_snapshots?.specific_media ? scopeStateFromServer(d.scope_snapshots.specific_media) : emptyScopeState(),
          all_media: d.scope_snapshots?.all_media ? scopeStateFromServer(d.scope_snapshots.all_media) : emptyScopeState(),
        });
      } else if (setupRes.status === 404 || setupRes.status === 422) {
        Alert.alert('Unavailable', setupRes.data?.message ?? "Couldn't open this automation.");
        router.back();
      }
      if (productsRes.status === 200) setProducts(productsRes.data?.products ?? []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId]);

  // Re-fetch just the product list on focus (not the whole setup — that
  // would reset in-progress edits) so a product added via "+ Add a new
  // product" below shows up immediately on returning to this screen.
  useFocusEffect(
    useCallback(() => {
      api.getProducts().then((res) => {
        if (res.status === 200) setProducts(res.data?.products ?? []);
      });
    }, []),
  );

  const selectScope = (next: Scope) => {
    if (next === scope) return;
    if (next === 'specific_media' && !hasConcreteMedia) return;
    setScope(next);
    setExpandedKey(null);
    setFallbackExpanded(false);
  };

  // ── Rules ──────────────────────────────────────────────────────────────

  const addRule = () => {
    const rule = blankRule(`new-${Date.now()}`);
    setState({ rules: [...state.rules, rule] });
    setExpandedKey(rule._key);
    setFallbackExpanded(false);
  };

  const patchRule = (key: string, patch: Partial<RuleState>) =>
    setState({ rules: state.rules.map((r) => (r._key === key ? { ...r, ...patch } : r)) });

  const deleteRule = (key: string) => {
    setState({ rules: state.rules.filter((r) => r._key !== key) });
    if (expandedKey === key) setExpandedKey(null);
  };

  const moveRule = (index: number, dir: -1 | 1) => {
    const next = [...state.rules];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setState({ rules: next });
  };

  const addFallback = () => {
    if (state.anyFallback) return;
    setState({ anyFallback: blankRule('fallback') });
    setFallbackExpanded(true);
    setExpandedKey(null);
  };

  const patchFallback = (patch: Partial<RuleState>) => setState({ anyFallback: state.anyFallback ? { ...state.anyFallback, ...patch } : null });

  const deleteFallback = () => {
    setState({ anyFallback: null });
    setFallbackExpanded(false);
  };

  const pickCardImage = async (target: { key: string; isFallback: boolean }) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to add a card image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploadingKey(target.key);
    try {
      const res = await api.uploadAutomationCardImage(asset.uri, asset.fileName ?? 'card.jpg', asset.mimeType ?? 'image/jpeg');
      if (res.status === 200) {
        const patch = { dm_card_image_path: res.data.path, dm_card_image_url: res.data.url };
        target.isFallback ? patchFallback(patch) : patchRule(target.key, patch);
      } else {
        Alert.alert('Upload failed', res.data?.message ?? 'Could not upload that image.');
      }
    } finally {
      setUploadingKey(null);
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────

  const buildPayload = (status: 'draft' | 'active') => ({
    type: 'comment',
    scope,
    media_id: scope === 'specific_media' ? mediaId : null,
    media_snapshot: scope === 'specific_media' ? media : null,
    status,
    product_id: state.productId,
    advanced: { once_per_user: state.oncePerUser, delay_enabled: state.delayEnabled, delay_seconds: state.delaySeconds },
    rules: state.rules.map((r) => ruleToPayload(r, true)),
    any_fallback: state.anyFallback ? ruleToPayload(state.anyFallback, false) : null,
  });

  const save = async (status: 'draft' | 'active') => {
    setSaving(status === 'active' ? 'live' : 'draft');
    try {
      const res = await api.saveAutomation(buildPayload(status));
      if (res.status === 200) {
        if (status === 'draft') {
          setState({ automationId: res.data.automation_id, status: res.data.status });
          Alert.alert('Draft saved');
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

  const remove = () => {
    if (!state.automationId) {
      router.back();
      return;
    }
    confirmDelete('automation', async () => {
      setDeleting(true);
      try {
        const res = await api.deleteAutomation(state.automationId!);
        if (res.status === 200) router.back();
      } finally {
        setDeleting(false);
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color={ui.accent} />
      </SafeAreaView>
    );
  }

  const canShowProduct = scope === 'specific_media';
  const visibleSteps = STEPS.filter((s) => s.value !== 'product' || canShowProduct);
  const hasLinkedProduct = state.productId !== null;
  const stepIndex = visibleSteps.findIndex((s) => s.value === step);
  const isFirstStep = stepIndex <= 0;
  const isLastStep = stepIndex === visibleSteps.length - 1;
  const goToStep = (delta: 1 | -1) => {
    const next = visibleSteps[stepIndex + delta];
    if (next) setStep(next.value);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <Segment options={visibleSteps} value={step} onChange={(v) => setStep(v as Step)} />

      <ScrollView className="px-6 pt-2" contentContainerStyle={{ paddingBottom: 24 }}>
        {step === 'setup' && (
          <View>
            <Text className="text-gray-700 mb-2 font-medium">Where should this automation apply?</Text>
            <View className="flex-row gap-2 mb-4">
              <Pressable
                onPress={() => selectScope('specific_media')}
                disabled={!hasConcreteMedia}
                className={`flex-1 rounded-2xl px-4 py-3.5 border ${scope === 'specific_media' ? 'bg-brand-50 border-brand-500' : 'bg-white border-gray-200'} ${!hasConcreteMedia ? 'opacity-40' : ''}`}
              >
                <Text className={`font-semibold ${scope === 'specific_media' ? 'text-brand-600' : 'text-gray-700'}`}>This post</Text>
                <Text className="text-gray-500 text-xs mt-0.5">Only comments on this post</Text>
              </Pressable>
              <Pressable
                onPress={() => selectScope('all_media')}
                className={`flex-1 rounded-2xl px-4 py-3.5 border ${scope === 'all_media' ? 'bg-brand-50 border-brand-500' : 'bg-white border-gray-200'}`}
              >
                <Text className={`font-semibold ${scope === 'all_media' ? 'text-brand-600' : 'text-gray-700'}`}>Any post or reel</Text>
                <Text className="text-gray-500 text-xs mt-0.5">Every post, current and future</Text>
              </Pressable>
            </View>

            {scope === 'specific_media' && media && (
              <View className="flex-row bg-gray-50 rounded-2xl p-3">
                {media.thumbnail_url ? (
                  <Image source={{ uri: media.thumbnail_url }} style={{ width: 56, height: 56, borderRadius: 10 }} />
                ) : (
                  <View style={{ width: 56, height: 56, borderRadius: 10 }} className="bg-gray-200 items-center justify-center">
                    <Ionicons name="image-outline" size={20} color={ui.placeholderText} />
                  </View>
                )}
                <Text className="flex-1 ml-3 text-gray-700 text-sm" numberOfLines={3}>
                  {media.caption || 'No caption'}
                </Text>
              </View>
            )}
          </View>
        )}

        {step === 'rules' && (
          <View>
            {state.rules.map((rule, index) => (
              <RuleCard
                key={rule._key}
                rule={rule}
                isFallback={false}
                expanded={expandedKey === rule._key}
                onToggleExpand={() => {
                  setExpandedKey(expandedKey === rule._key ? null : rule._key);
                  setFallbackExpanded(false);
                }}
                onChange={(patch) => patchRule(rule._key, patch)}
                onDelete={() => deleteRule(rule._key)}
                onMoveUp={index > 0 ? () => moveRule(index, -1) : undefined}
                onMoveDown={index < state.rules.length - 1 ? () => moveRule(index, 1) : undefined}
                hasLinkedProduct={hasLinkedProduct}
                uploadingImage={uploadingKey === rule._key}
                onPickCardImage={() => pickCardImage({ key: rule._key, isFallback: false })}
              />
            ))}

            <Pressable onPress={addRule} className="flex-row items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-2xl py-3.5 mb-4">
              <Ionicons name="add" size={16} color={ui.accent} style={{ marginRight: 6 }} />
              <Text className="text-gray-700 font-medium">Add Rule</Text>
            </Pressable>

            {state.anyFallback ? (
              <RuleCard
                rule={state.anyFallback}
                isFallback
                expanded={fallbackExpanded}
                onToggleExpand={() => {
                  setFallbackExpanded(!fallbackExpanded);
                  setExpandedKey(null);
                }}
                onChange={patchFallback}
                onDelete={deleteFallback}
                hasLinkedProduct={hasLinkedProduct}
                uploadingImage={uploadingKey === 'fallback'}
                onPickCardImage={() => pickCardImage({ key: 'fallback', isFallback: true })}
              />
            ) : (
              <Pressable onPress={addFallback} className="flex-row items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-2xl py-3.5">
                <Ionicons name="add" size={16} color={ui.accent} style={{ marginRight: 6 }} />
                <Text className="text-gray-700 font-medium">Add "Any Comment" fallback</Text>
              </Pressable>
            )}
          </View>
        )}

        {step === 'product' && canShowProduct && (
          <View>
            <Text className="text-gray-500 text-sm mb-3">Link a catalog product this post sells — required for Chatbot mode, and used to prefill a Lead.</Text>
            <Pressable
              onPress={() => setState({ productId: null })}
              className={`rounded-2xl px-4 py-3.5 border mb-2 ${state.productId === null ? 'bg-brand-50 border-brand-500' : 'bg-white border-gray-200'}`}
            >
              <Text className={state.productId === null ? 'text-brand-600 font-semibold' : 'text-gray-700'}>None</Text>
            </Pressable>
            {products.map((p) => {
              const active = state.productId === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setState({ productId: p.id })}
                  className={`flex-row justify-between items-center rounded-2xl px-4 py-3.5 border mb-2 ${active ? 'bg-brand-50 border-brand-500' : 'bg-white border-gray-200'}`}
                >
                  <Text className={active ? 'text-brand-600 font-semibold' : 'text-gray-700'}>{p.name}</Text>
                  <Text className="text-gray-500 text-sm">₹{p.price}</Text>
                </Pressable>
              );
            })}
            {products.length === 0 && (
              <Text className="text-gray-400 text-sm text-center py-2 mb-1">You haven't added any products yet.</Text>
            )}

            <Pressable onPress={() => router.push('/(tabs)/home/product-form')} className="mt-1">
              <Text className="text-brand-500 font-semibold text-sm">+ Add a new product</Text>
            </Pressable>
          </View>
        )}

        {step === 'advanced' && (
          <View>
            <View className="mb-4">
              <Checkbox checked={state.oncePerUser} onToggle={() => setState({ oncePerUser: !state.oncePerUser })} label="Only respond once per user" />
            </View>
            <Checkbox checked={state.delayEnabled} onToggle={() => setState({ delayEnabled: !state.delayEnabled })} label="Send Delay" />
            {state.delayEnabled && (
              <View className="mt-2">
                <Text className="text-gray-500 text-xs mb-3">Delayed sending isn't available yet — turn this off to activate the automation.</Text>
                <TextInput
                  value={String(state.delaySeconds)}
                  onChangeText={(v) => setState({ delaySeconds: Number(v.replace(/[^0-9]/g, '')) || 0 })}
                  keyboardType="number-pad"
                  placeholder="Seconds"
                  placeholderTextColor={ui.placeholderText}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-gray-900 w-32"
                />
              </View>
            )}
          </View>
        )}

        <View className="mt-6">
          {!isFirstStep && (
            <Pressable onPress={() => goToStep(-1)} className="flex-row items-center self-start mb-3">
              <Ionicons name="chevron-back" size={16} color="#6B7280" />
              <Text className="text-gray-600 text-sm font-semibold ml-0.5">Back</Text>
            </Pressable>
          )}

          {isLastStep ? (
            <GradientButton label="Go Live" onPress={() => save('active')} loading={saving === 'live'} disabled={saving !== null} />
          ) : (
            <GradientButton label="Next" icon="arrow-forward" onPress={() => goToStep(1)} disabled={saving !== null} />
          )}

          <View className="mt-2">
            <SolidButton label="Save Draft" onPress={() => save('draft')} loading={saving === 'draft'} disabled={saving !== null} />
          </View>
          {!!state.automationId && (
            <View className="mt-2">
              <SolidButton label="Delete Automation" variant="danger" onPress={remove} loading={deleting} />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

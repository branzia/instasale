import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from 'react-native';
import Checkbox from '@/components/Checkbox';
import { ui } from '@/config';

export type DmMode = 'custom' | 'chatbot' | 'card';

export type RuleState = {
  _key: string;
  id: number | null;
  name: string;
  keywords: string[];
  newKeyword: string;
  public_reply_enabled: boolean;
  public_reply_text: string;
  dm_enabled: boolean;
  dm_text: string;
  dm_mode: DmMode;
  dm_card_image_path: string | null;
  dm_card_image_url: string | null;
  dm_card_headline: string;
  dm_card_description: string;
  dm_card_button_label: string;
  dm_card_button_url: string;
  enabled: boolean;
};

export function blankRule(key: string): RuleState {
  return {
    _key: key,
    id: null,
    name: '',
    keywords: [],
    newKeyword: '',
    public_reply_enabled: false,
    public_reply_text: '',
    dm_enabled: false,
    dm_text: '',
    dm_mode: 'custom',
    dm_card_image_path: null,
    dm_card_image_url: null,
    dm_card_headline: '',
    dm_card_description: '',
    dm_card_button_label: '',
    dm_card_button_url: '',
    enabled: true,
  };
}

interface Props {
  rule: RuleState;
  /** true = the single "Any Comment" fallback card — hides name/keywords. */
  isFallback: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onChange: (patch: Partial<RuleState>) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  hasLinkedProduct: boolean;
  uploadingImage: boolean;
  onPickCardImage: () => void;
}

const DM_MODES: { value: DmMode; label: string }[] = [
  { value: 'custom', label: 'Text' },
  { value: 'chatbot', label: 'Chatbot' },
  { value: 'card', label: 'Card' },
];

/**
 * One rule editor card — a keyword rule (isFallback=false) or the single
 * "Any Comment" fallback (isFallback=true, same shape minus name/keywords).
 * Mirrors App\Filament\Instagram\Pages\AutomationSetup's rule card exactly:
 * name/keywords, Reply Publicly toggle+text, Send DM toggle + mode
 * (Custom text / Chatbot / Card) with mode-specific fields, enabled switch,
 * reorder, delete.
 */
export default function RuleCard({
  rule,
  isFallback,
  expanded,
  onToggleExpand,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  hasLinkedProduct,
  uploadingImage,
  onPickCardImage,
}: Props) {
  const addKeyword = () => {
    const pieces = rule.newKeyword
      .split(/[,\n]/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (pieces.length === 0) return;
    const seen = new Set(rule.keywords.map((k) => k.toLowerCase()));
    const next = [...rule.keywords];
    for (const p of pieces) {
      const lower = p.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        next.push(p.slice(0, 60));
      }
    }
    onChange({ keywords: next.slice(0, 20), newKeyword: '' });
  };

  const removeKeyword = (i: number) => onChange({ keywords: rule.keywords.filter((_, idx) => idx !== i) });

  const title = isFallback ? 'Any Comment' : rule.name.trim() || 'Untitled rule';

  return (
    <View className="bg-gray-50 rounded-2xl mb-3 overflow-hidden">
      <Pressable onPress={onToggleExpand} className="flex-row items-center px-4 py-3.5">
        <View className="flex-1 mr-2">
          <Text className="font-semibold text-gray-900" numberOfLines={1}>
            {title}
          </Text>
          {!isFallback && rule.keywords.length > 0 && (
            <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
              {rule.keywords.join(', ')}
            </Text>
          )}
        </View>
        {!rule.enabled && (
          <View className="bg-gray-200 rounded-full px-2 py-0.5 mr-2">
            <Text className="text-[10px] font-medium text-gray-500">OFF</Text>
          </View>
        )}
        {!isFallback && (onMoveUp || onMoveDown) && (
          <View className="flex-row mr-1">
            <Pressable onPress={onMoveUp} disabled={!onMoveUp} className="p-1" hitSlop={6}>
              <Ionicons name="chevron-up" size={16} color={onMoveUp ? '#6B7280' : '#E5E7EB'} />
            </Pressable>
            <Pressable onPress={onMoveDown} disabled={!onMoveDown} className="p-1" hitSlop={6}>
              <Ionicons name="chevron-down" size={16} color={onMoveDown ? '#6B7280' : '#E5E7EB'} />
            </Pressable>
          </View>
        )}
        <Pressable onPress={onDelete} className="p-1.5" hitSlop={6}>
          <Ionicons name="trash-outline" size={16} color="#DC2626" />
        </Pressable>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#9CA3AF" style={{ marginLeft: 4 }} />
      </Pressable>

      {expanded && (
        <View className="px-4 pb-4 pt-1">
          <View className="mb-3">
            <Checkbox checked={rule.enabled} onToggle={() => onChange({ enabled: !rule.enabled })} label="Rule enabled" />
          </View>

          {!isFallback && (
            <>
              <Text className="text-gray-700 mb-1.5 text-sm font-medium">Rule name</Text>
              <TextInput
                value={rule.name}
                onChangeText={(v) => onChange({ name: v })}
                placeholder="e.g. Price"
                placeholderTextColor={ui.placeholderText}
                className="bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-gray-900 mb-3"
              />

              <Text className="text-gray-700 mb-1.5 text-sm font-medium">Keywords</Text>
              <View className="flex-row flex-wrap gap-1.5 mb-2">
                {rule.keywords.map((k, i) => (
                  <View key={`${k}-${i}`} className="flex-row items-center bg-white border border-gray-200 rounded-full pl-3 pr-1.5 py-1">
                    <Text className="text-gray-700 text-xs mr-1">{k}</Text>
                    <Pressable onPress={() => removeKeyword(i)} hitSlop={6}>
                      <Ionicons name="close-circle" size={14} color="#9CA3AF" />
                    </Pressable>
                  </View>
                ))}
              </View>
              <View className="flex-row gap-2 mb-3">
                <TextInput
                  value={rule.newKeyword}
                  onChangeText={(v) => onChange({ newKeyword: v })}
                  onSubmitEditing={addKeyword}
                  placeholder="Add a keyword, then Enter"
                  placeholderTextColor={ui.placeholderText}
                  className="bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-gray-900 flex-1"
                />
                <Pressable onPress={addKeyword} className="bg-brand-500 rounded-xl px-4 items-center justify-center">
                  <Ionicons name="add" size={18} color="#fff" />
                </Pressable>
              </View>
            </>
          )}

          <Checkbox
            checked={rule.public_reply_enabled}
            onToggle={() => onChange({ public_reply_enabled: !rule.public_reply_enabled })}
            label="Reply publicly"
          />
          {rule.public_reply_enabled && (
            <TextInput
              value={rule.public_reply_text}
              onChangeText={(v) => onChange({ public_reply_text: v })}
              placeholder="Public reply text"
              placeholderTextColor={ui.placeholderText}
              multiline
              className="bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-gray-900 mt-2 mb-3 min-h-[60px]"
            />
          )}

          <Checkbox checked={rule.dm_enabled} onToggle={() => onChange({ dm_enabled: !rule.dm_enabled })} label="Send a DM" />

          {rule.dm_enabled && (
            <View className="mt-2">
              <View className="flex-row gap-2 mb-3">
                {DM_MODES.map((mode) => {
                  const active = rule.dm_mode === mode.value;
                  return (
                    <Pressable
                      key={mode.value}
                      onPress={() => onChange({ dm_mode: mode.value })}
                      className={`px-3.5 py-1.5 rounded-full ${active ? 'bg-brand-500' : 'bg-white border border-gray-200'}`}
                    >
                      <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-gray-600'}`}>{mode.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {rule.dm_mode === 'custom' && (
                <TextInput
                  value={rule.dm_text}
                  onChangeText={(v) => onChange({ dm_text: v })}
                  placeholder="DM text"
                  placeholderTextColor={ui.placeholderText}
                  multiline
                  className="bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-gray-900 min-h-[60px]"
                />
              )}

              {rule.dm_mode === 'chatbot' && (
                <View className="bg-brand-50 rounded-xl px-3.5 py-3">
                  <Text className="text-brand-600 text-sm">
                    {hasLinkedProduct
                      ? 'Sends a product Q&A conversation using the product linked on the Product tab.'
                      : 'Link a product on the Product tab to use Chatbot mode.'}
                  </Text>
                </View>
              )}

              {rule.dm_mode === 'card' && (
                <View>
                  <Pressable
                    onPress={onPickCardImage}
                    disabled={uploadingImage}
                    className="bg-white border border-dashed border-gray-300 rounded-xl h-32 items-center justify-center mb-3 overflow-hidden"
                  >
                    {uploadingImage ? (
                      <ActivityIndicator color={ui.accent} />
                    ) : rule.dm_card_image_url ? (
                      <Image source={{ uri: rule.dm_card_image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <>
                        <Ionicons name="image-outline" size={22} color={ui.placeholderText} />
                        <Text className="text-gray-400 text-xs mt-1">Tap to add an image</Text>
                      </>
                    )}
                  </Pressable>

                  <TextInput
                    value={rule.dm_card_headline}
                    onChangeText={(v) => onChange({ dm_card_headline: v })}
                    placeholder="Headline"
                    placeholderTextColor={ui.placeholderText}
                    maxLength={80}
                    className="bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-gray-900 mb-2"
                  />
                  <TextInput
                    value={rule.dm_card_description}
                    onChangeText={(v) => onChange({ dm_card_description: v })}
                    placeholder="Description (optional)"
                    placeholderTextColor={ui.placeholderText}
                    maxLength={80}
                    className="bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-gray-900 mb-2"
                  />
                  <View className="flex-row gap-2">
                    <TextInput
                      value={rule.dm_card_button_label}
                      onChangeText={(v) => onChange({ dm_card_button_label: v })}
                      placeholder="Button label"
                      placeholderTextColor={ui.placeholderText}
                      maxLength={20}
                      className="bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-gray-900 flex-1"
                    />
                    <TextInput
                      value={rule.dm_card_button_url}
                      onChangeText={(v) => onChange({ dm_card_button_url: v })}
                      placeholder="Button URL"
                      placeholderTextColor={ui.placeholderText}
                      autoCapitalize="none"
                      keyboardType="url"
                      className="bg-white border border-gray-200 rounded-xl px-3.5 py-3 text-gray-900 flex-1"
                    />
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

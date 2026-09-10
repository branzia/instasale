import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '@/components/GradientButton';
import InfoRow from '@/components/InfoRow';
import SolidButton from '@/components/SolidButton';
import StepRow from '@/components/StepRow';
import { gradientShort, ui } from '@/config';
import { useAuth } from '@/context/AuthContext';
import * as api from '@/services/api';

const DASHBOARD_URL = 'https://branzia.app/instagram';

/**
 * Step 5 — replaces the old in-app "Connect Instagram" OAuth flow
 * (2026-09, explicit user call: there is no Instagram Connect from the
 * mobile app at all anymore). This screen is purely passive: it tells the
 * merchant to connect from the web dashboard and lets them re-check status
 * once they have. The actual OAuth handshake stays entirely on
 * `/instagram` → Meta Embedded Signup (App\Http\Controllers\Social\
 * InstagramController), unchanged.
 *
 * Redesigned 2026-09-10 (explicit user call — "redesign properly, focus on
 * content"): the old version was just an icon + one paragraph + a single
 * button. This replaces the camera emoji with SaleDM's actual logo mark
 * (same treatment as Splash — see components/Splash.tsx), breaks the
 * paragraph into the numbered-step layout already established on
 * (auth)/scan.tsx (via the shared StepRow component), and adds an actual
 * "Open Web Dashboard" action — opening the browser is the one thing a
 * merchant on this screen is always about to do next, so it's one tap
 * instead of a URL they have to type in themselves. Opening a browser tab
 * to `/instagram` is not an in-app OAuth handshake — the connect flow
 * itself still happens entirely on that web page.
 *
 * Filled out further the same day ("increase more details, lots of empty
 * space" — the step list alone left most of the screen blank): added the
 * signed-in account card and "Why connect Instagram" info rows (via the
 * shared InfoRow component, also extracted from scan.tsx) below the step
 * list, plus a "Not you? Sign out" link. That link isn't just filler — a
 * merchant stuck here after pairing the wrong account previously had no
 * way to sign out at all, since Settings only exists under (tabs)/home,
 * which this same onboarding gate blocks until Instagram is connected.
 * The logo/title/description block sits above the ScrollView (not inside
 * it) — it's the screen's identity, not scrollable content, so it stays
 * pinned in place while the steps/info/account content beneath it scrolls.
 */
export default function InstagramRequired() {
  const { account, setIsInstagramConnected, signOut } = useAuth();
  const [checking, setChecking] = useState(false);

  const checkAgain = async () => {
    setChecking(true);
    try {
      const res = await api.getInstagramConnectionStatus();
      if (res.status === 200 && res.data?.connected) {
        setIsInstagramConnected(true);
        return;
      }
      if (res.status === 0) {
        Alert.alert("Can't reach Branzia", 'Check your internet connection and try again.');
        return;
      }
      Alert.alert('Not connected yet', "We haven't detected a connected Instagram account yet.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Identity block stays pinned above the scroll — it's "what screen is
          this", not scrollable content, so it shouldn't disappear upward
          while reading the steps/info below it. */}
      <View className="items-center pt-10 pb-6 px-8">
        <LinearGradient
          colors={gradientShort as unknown as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 80, height: 80, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
        >
          <Image source={require('@/assets/logo-mark.png')} style={{ width: 52, height: 52 }} resizeMode="contain" />
        </LinearGradient>
        <Text className="text-2xl font-bold text-gray-900 mt-5 text-center">Connect Instagram on the Web</Text>
        <Text className="text-gray-500 text-center text-sm mt-2 px-2">
          One last step — link your Instagram Business account from the Branzia web dashboard, then come back here.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 mt-2">
          <Text className="text-gray-900 font-semibold text-base mb-3">How to connect</Text>
          <StepRow number={1} text="Open branzia.app/instagram on your computer or phone browser." />
          <StepRow number={2} text="Sign in and connect your Instagram Business account there." />
          <StepRow number={3} text="Come back to SaleDM and tap “Check Again” below." />
        </View>

        <View className="px-6 mt-6">
          <Text className="text-gray-900 font-semibold text-base mb-3">Why connect Instagram</Text>
          <InfoRow
            icon="chatbubbles-outline"
            title="Automate comments & DMs"
            body="Once connected, SaleDM can auto-reply to comments and DMs on your posts and reels for you."
          />
          <InfoRow
            icon="person-add-outline"
            title="Capture leads automatically"
            body="Conversations that show buying intent become Leads you can follow up on right from the app."
          />
          <InfoRow
            icon="shield-checkmark-outline"
            title="You stay in control"
            body="Disconnect anytime from Settings — nothing gets posted or replied to outside the rules you set up."
          />
        </View>

        <View className="px-6 mt-6 mb-6">
          <Text className="text-gray-900 font-semibold text-base mb-3">Signed in as</Text>
          <View className="flex-row items-center bg-gray-50 rounded-2xl p-4">
            <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
              <Ionicons name="person-outline" size={18} color={ui.placeholderText} />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold">{account?.name ?? '—'}</Text>
              <Text className="text-gray-500 text-sm">{account?.email ?? '—'}</Text>
            </View>
          </View>
          <Pressable onPress={signOut} hitSlop={8} className="self-center mt-3 py-1">
            <Text className="text-gray-400 text-sm">
              Not you? <Text className="text-gray-600 font-semibold">Sign out</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View className="px-6 pt-4 pb-2" style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
        <GradientButton
          label="Open Web Dashboard"
          icon="open-outline"
          onPress={() => Linking.openURL(DASHBOARD_URL)}
        />
        <View style={{ height: 10 }} />
        <SolidButton
          label="I've Connected — Check Again"
          icon="refresh-outline"
          onPress={checkAgain}
          loading={checking}
        />
      </View>
    </SafeAreaView>
  );
}

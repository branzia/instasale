import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '@/components/GradientButton';
import { gradientShort } from '@/config';
import { useAuth } from '@/context/AuthContext';
import * as api from '@/services/api';

/**
 * Step 5 — replaces the old in-app "Connect Instagram" OAuth flow
 * (2026-09, explicit user call: there is no Instagram Connect from the
 * mobile app at all anymore). This screen is purely passive: it tells the
 * merchant to connect from the web dashboard and lets them re-check status
 * once they have. The actual OAuth handshake stays entirely on
 * `/instagram` → Meta Embedded Signup (App\Http\Controllers\Social\
 * InstagramController), unchanged.
 */
export default function InstagramRequired() {
  const { setIsInstagramConnected } = useAuth();
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
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 px-6 justify-between py-10">
        <View className="items-center mt-16">
          <LinearGradient
            colors={gradientShort as unknown as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 88, height: 88, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text className="text-4xl">📷</Text>
          </LinearGradient>
          <Text className="text-2xl font-bold text-gray-900 mt-6 text-center">Connect Instagram on the Web</Text>
          <Text className="text-gray-500 text-center mt-2 px-4">
            Instagram is connected from the Branzia web dashboard, not from this app. Go to{' '}
            <Text className="font-semibold text-gray-700">branzia.app/instagram</Text> on your computer or phone
            browser, connect your Instagram Business account there, then check again below.
          </Text>
        </View>

        <View>
          <GradientButton label="I've Connected — Check Again" onPress={checkAgain} loading={checking} />
        </View>
      </View>
    </SafeAreaView>
  );
}

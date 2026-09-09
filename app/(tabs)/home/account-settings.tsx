import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '@/components/Card';
import ScreenHeader from '@/components/ScreenHeader';
import SolidButton from '@/components/SolidButton';
import { ui } from '@/config';
import { useAuth } from '@/context/AuthContext';
import * as api from '@/services/api';

/**
 * Account info, Instagram disconnect, sign out — the former standalone
 * Settings tab's whole content, unchanged. Reached from Home's gear icon
 * (2026-09-09 footer reduction) rather than its own tab — see
 * home/index.tsx and CLAUDE.md's footer-reduction note. Deliberately a
 * pushed screen, not a section on Home itself: Disconnect/Sign Out are
 * destructive-ish actions that shouldn't sit in a scrolling feed where a
 * mis-tap is easy.
 */
export default function AccountSettings() {
  const { account, isInstagramConnected, setIsInstagramConnected, signOut } = useAuth();
  const [disconnecting, setDisconnecting] = useState(false);

  const disconnect = () => {
    Alert.alert('Disconnect Instagram?', 'You will stop receiving comments and DMs until you reconnect.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          setDisconnecting(true);
          try {
            const res = await api.disconnectInstagram();
            if (res.status === 200 || res.status === 204) {
              setIsInstagramConnected(false);
            }
          } finally {
            setDisconnecting(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Settings" />
      <ScrollView className="px-6 pt-2">
        <Card>
          <View className="flex-row items-center mb-1">
            <Ionicons name="person-circle-outline" size={18} color={ui.placeholderText} />
            <Text className="text-gray-400 text-xs ml-1.5">ACCOUNT</Text>
          </View>
          <Text className="text-gray-900 font-semibold">{account?.name ?? '—'}</Text>
          <Text className="text-gray-500 text-sm">{account?.email ?? '—'}</Text>
        </Card>

        <Card>
          <View className="flex-row items-center mb-3">
            <Ionicons name="logo-instagram" size={18} color={ui.placeholderText} />
            <Text className="text-gray-400 text-xs ml-1.5">INSTAGRAM</Text>
          </View>
          <View className="flex-row items-center mb-3">
            <View className={`w-2 h-2 rounded-full mr-2 ${isInstagramConnected ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            <Text className="text-gray-900 font-semibold">{isInstagramConnected ? 'Connected' : 'Not connected'}</Text>
          </View>
          {isInstagramConnected && (
            <SolidButton
              label={disconnecting ? 'Disconnecting…' : 'Disconnect Instagram'}
              variant="danger"
              disabled={disconnecting}
              onPress={disconnect}
            />
          )}
        </Card>

        <View className="mt-2 mb-10">
          <SolidButton label="Sign Out" icon="log-out-outline" onPress={signOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { BackHandler, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '@/components/GradientButton';
import InfoRow from '@/components/InfoRow';
import SolidButton from '@/components/SolidButton';
import StepRow from '@/components/StepRow';
import { app, gradientShort, ui } from '@/config';
import { useAuth } from '@/context/AuthContext';
import * as api from '@/services/api';

/**
 * InstaSale's only sign-in screen — Login/Register forms were removed
 * entirely (2026-09, explicit user call). The merchant is already signed
 * into the Branzia web dashboard (`/instagram` → "Connect Mobile App"),
 * which shows a short-lived QR code; scanning it here exchanges the code
 * for a bearer token via `Api\Account\PairingController::confirm()` — no
 * typed credentials, ever, in this app.
 *
 * Accepts either a bare code or a `InstaSale://pair?code=...` deep-link
 * string as the QR payload, so a code scanned by the phone's ordinary
 * camera app (which would try to open it as a link) and one scanned here
 * both resolve the same way.
 */
function extractCode(raw: string): string | null {
  const match = raw.match(/[?&]code=([^&]+)/);
  if (match) return decodeURIComponent(match[1]);
  return raw.trim() || null;
}

export default function Scan() {
  const { signIn } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  // The camera only opens once the merchant taps in — this is the root
  // (auth) screen with no prior screen to return to, so "closing" the
  // scanner means backing out to this idle state, not exiting the app.
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeCamera = () => {
    setCameraOpen(false);
    setScanning(true);
    setConfirming(false);
    setError(null);
  };

  // While the camera is open, let the Android hardware/gesture back action
  // close it (back to the idle screen) instead of falling through to the
  // OS default of exiting the app.
  useEffect(() => {
    if (!cameraOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeCamera();
      return true;
    });
    return () => sub.remove();
  }, [cameraOpen]);

  const openCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setCameraOpen(true);
  };

  const handleScan = async ({ data }: { data: string }) => {
    if (!scanning || confirming) return;
    const code = extractCode(data);
    if (!code) return;

    setScanning(false);
    setConfirming(true);
    setError(null);

    try {
      const res = await api.confirmPairing(code);
      if (res.status === 200 && res.data?.token && res.data?.account) {
        await signIn(res.data.token, res.data.account);
        return;
      }
      if (res.status === 0) {
        setError("Can't reach Branzia. Check your internet connection.");
      } else {
        setError(res.data?.message ?? 'That code is no longer valid. Generate a new one on the web dashboard.');
      }
    } finally {
      setConfirming(false);
      // Re-enable scanning after a short delay so a failed/expired code
      // doesn't immediately re-fire on the same still-visible QR frame.
      setTimeout(() => setScanning(true), 1500);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color={ui.accent} />
      </SafeAreaView>
    );
  }

  if (!cameraOpen) {
    const wasDenied = permission.status === 'denied' && !permission.canAskAgain;

    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
          <View className="items-center pt-10 pb-6 px-8">
            <LinearGradient
              colors={gradientShort as unknown as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="qr-code-outline" size={32} color="#fff" />
            </LinearGradient>
            <Text className="text-gray-900 font-bold text-2xl text-center mt-5">Scan to Sign In</Text>
            <Text className="text-gray-500 text-center text-sm mt-2 px-4">
              {app.appName} pairs with your Branzia web dashboard — there's no password to type here.
            </Text>
          </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View className="px-6 mb-2">
            <Text className="text-gray-900 font-semibold text-base mb-3">How to sign in</Text>
            <StepRow number={1} text="Open branzia.app/instagram on your computer or phone browser." />
            <StepRow number={2} text="Go to Connect Mobile App — it shows a QR code that refreshes every 2 minutes." />
            <StepRow number={3} text="Tap “Scan QR Code” below and point your phone at that screen." />
          </View>

          <View className="px-6 mt-4">
            <Text className="text-gray-900 font-semibold text-base mb-3">What InstaSale does for you</Text>
            <InfoRow
              icon="chatbubbles-outline"
              title="Comment & DM Automation"
              body="Auto-replies handle Instagram comments and DMs on your posts so no customer is left waiting."
            />
            <InfoRow
              icon="person-add-outline"
              title="Leads"
              body="Conversations that show buying intent are captured here as Leads you can review and follow up on."
            />
            <InfoRow
              icon="card-outline"
              title="Lead to Sale"
              body="Send a payment link straight from a Lead, and once it's paid it shows up here as a confirmed Order."
            />
          </View>
        </ScrollView>

        <View className="px-6 pt-4 pb-2" style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
          {wasDenied ? (
            <>
              <View className="flex-row items-start bg-red-50 rounded-2xl px-4 py-3 mb-3">
                <Ionicons name="alert-circle-outline" size={18} color="#DC2626" style={{ marginRight: 8, marginTop: 1 }} />
                <Text className="flex-1 text-red-600 text-sm">
                  Camera access is off, so {app.appName} can't scan a code. Turn it on in your phone's Settings app to
                  continue.
                </Text>
              </View>
              <SolidButton label="Open Settings" icon="settings-outline" onPress={() => Linking.openSettings()} />
            </>
          ) : (
            <>
              <GradientButton label="Scan QR Code" icon="qr-code-outline" onPress={openCamera} />
              <Text className="text-gray-400 text-xs text-center mt-3">
                Opens the scanner built into {app.appName} — you won't need your phone's own Camera app.
              </Text>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanning ? handleScan : undefined}
      />

      {/* One header block, not a button floating disconnected in the corner:
          the close button sits in its own row, the instructions in their
          own row below it, both grounded on a shared scrim so either reads
          clearly over whatever the camera feed behind them looks like. */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0)']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
      >
        <SafeAreaView edges={['top']}>
          <View className="flex-row items-center px-4 pt-2 pb-1">
            <Pressable
              onPress={closeCamera}
              hitSlop={12}
              className="w-10 h-10 items-center justify-center rounded-full bg-white/15"
            >
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
          </View>
          <View className="items-center px-8 pb-6">
            <Text className="text-white text-lg font-bold mb-1 text-center">Point at the code on branzia.app/instagram</Text>
            <Text className="text-white/80 text-center text-sm">
              Open “Connect Mobile App” on the web dashboard to see it.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Scan-frame guide — purely visual, doesn't gate detection. */}
      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <View style={{ width: 240, height: 240, borderRadius: 24, borderWidth: 3, borderColor: 'rgba(255,255,255,0.85)' }} />
      </View>

      <SafeAreaView className="absolute inset-x-0 bottom-0" edges={['bottom']}>
        <View className="items-center pb-8 px-8">
          {confirming && (
            <View className="flex-row items-center bg-black/60 rounded-2xl px-4 py-3">
              <ActivityIndicator color="#fff" />
              <Text className="text-white ml-3">Signing in…</Text>
            </View>
          )}
          {!confirming && error && (
            <View className="flex-row items-center bg-black/60 rounded-2xl px-4 py-3">
              <Ionicons name="alert-circle" size={18} color="#F87171" style={{ marginRight: 8 }} />
              <Text className="flex-1 text-white">{error}</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

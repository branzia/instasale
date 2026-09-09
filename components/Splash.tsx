import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { gradient } from '@/config';
import { app } from '@/config';

/**
 * Full-screen splash shown while AuthContext resolves the stored token
 * (and, once real auth-session persistence exists, while re-checking
 * product access / Instagram connection state) — step 1 of the app's
 * onboarding flow. Not registered as its own expo-router route: showing
 * it is just what the root layout renders in place of a Slot while
 * `isLoading` is true, so there's nothing to navigate back to.
 *
 * The badge shows Ionicons' generic Instagram glyph (2026-09-09, explicit
 * user call — a stylistic nod since this app is Instagram-themed, not
 * Meta's actual trademarked logo artwork) in place of the placeholder 📩
 * emoji this used to show. Same glyph is baked into the static app-icon
 * PNGs (see app.config.js + assets/icon.png) for consistency.
 */
export default function Splash() {
  return (
    <LinearGradient
      colors={gradient as unknown as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <View className="items-center">
        <View className="w-24 h-24 rounded-3xl bg-white/20 items-center justify-center mb-5">
          <Ionicons name="logo-instagram" size={44} color="#fff" />
        </View>
        <Text className="text-white text-3xl font-bold">{app.appName}</Text>
        <Text className="text-white/90 text-base mt-2">{app.tagline}</Text>
      </View>
    </LinearGradient>
  );
}

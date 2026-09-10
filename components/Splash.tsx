import { LinearGradient } from 'expo-linear-gradient';
import { Image, Text, View } from 'react-native';
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
 * The badge shows SaleDM's actual logo mark (2026-09-10 — replaced
 * Ionicons' generic Instagram glyph placeholder, which was itself a
 * 2026-09-09 stand-in for the original 📩 emoji) via
 * `assets/logo-mark.png` — a transparent-background white silhouette of
 * the same mark baked into the app icon (see app.config.js +
 * assets/icon.png), so the splash badge and the home-screen icon read as
 * one consistent logo rather than two different marks. This is a tightly
 * cropped version of `assets/android-icon-monochrome.png`, not that file
 * itself: the adaptive-icon source has a large transparent safe-zone
 * margin baked in (required so Android can mask it into a circle/squircle/
 * etc. without clipping the glyph) — the glyph itself is only ~34% of
 * that canvas, so displaying it directly in a UI badge at a normal icon
 * size renders as a barely-visible speck. Don't swap this back to one of
 * the adaptive-icon PNGs — those are for app.config.js's icon fields only.
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
          <Image
            source={require('@/assets/logo-mark.png')}
            style={{ width: 64, height: 64 }}
            resizeMode="contain"
          />
        </View>
        <Text className="text-white text-3xl font-bold">{app.appName}</Text>
        <Text className="text-white/90 text-base mt-2">{app.tagline}</Text>
      </View>
    </LinearGradient>
  );
}

module.exports = {
  expo: {
    name: 'InstaSale',
    slug: 'InstaSale',
    scheme: 'InstaSale',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.branzia.InstaSale',
    },
    // Superseded by the `expo-splash-screen` plugin below (SDK 53+) — kept
    // in sync with it for tools/platforms that still read this legacy key
    // directly, but the plugin config is what actually controls the app.
    splash: {
      image: './assets/logo-mark.png',
      resizeMode: 'contain',
      backgroundColor: '#C13584',
    },
    android: {
      package: 'com.branzia.InstaSale',
      versionCode: 1,
      adaptiveIcon: {
        backgroundImage: './assets/android-icon-background.png',
        foregroundImage: './assets/android-icon-foreground.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    // expo-camera (2026-09, added for the QR-scan sign-in screen — see
    // (auth)/scan.tsx) is a config-plugin-based native module, but it's
    // one of the modules Expo Go itself bundles support for, so this still
    // doesn't force a dev-client/prebuild the way react-native-firebase
    // would. The permission strings below are what Expo Go's own runtime
    // permission prompt shows.
    plugins: [
      'expo-secure-store',
      'expo-router',
      'expo-font',
      // Controls the native pre-JS splash — required as of SDK 53+;
      // without it, Android 12+'s own System Splash Screen API takes over
      // during the ~2s native-launch window and renders an OS/OEM default
      // instead of this app's own art (on at least one Vivo/FuntouchOS
      // device this surfaced as a stray wallpaper-derived pattern flashing
      // before real content took over). The legacy top-level `splash` key
      // above is no longer enough on its own to control this.
      //
      // One plain glyph everywhere (2026-09-11) — an earlier attempt used
      // custom-generated gradient art, split per-platform around Android
      // 12+'s SplashScreen API forcing every app's native splash into a
      // small icon on a flat color regardless of `resizeMode`/image
      // content (a first full-bleed image got force-fit into a squished
      // sliver on a real device). `imageWidth` sidesteps that fight
      // entirely: assets/logo-mark.png (the plain white glyph already used
      // elsewhere in the app) at a fixed, sane width, same on every
      // platform, no resizeMode ambiguity to get wrong per-OS.
      [
        'expo-splash-screen',
        {
          image: './assets/logo-mark.png',
          imageWidth: 200,
          backgroundColor: '#C13584',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission: 'Allow $(PRODUCT_NAME) to use your camera to scan the sign-in code from the Branzia web dashboard.',
        },
      ],
    ],
    extra: {
      router: {},
      eas: {
        projectId: '2af296f1-5cdd-4e13-9aec-6515ed22bccc',
      },
    },
    owner: 'itsvishwa01',
  },
};

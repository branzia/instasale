module.exports = {
  expo: {
    name: 'SaleDM',
    slug: 'saledm',
    scheme: 'saledm',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.branzia.saledm',
    },
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    android: {
      package: 'com.branzia.saledm',
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

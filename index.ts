// No react-native-firebase background message handler here (unlike
// Branzia Merchant) — this app deliberately runs inside plain Expo Go for
// now, and react-native-firebase requires a custom dev client. Push
// notifications go through expo-notifications/Expo push tokens instead
// (see services/notifications.ts) once the backend sends them.

// Holds the native splash (app.config.js's expo-splash-screen plugin) on
// screen past its own default auto-hide point, which fires as soon as the
// root view attaches — well before this JS bundle has finished evaluating
// and painted a first frame. Without this call, that gap showed as a
// solid black screen (the Activity's raw window background) sandwiched
// between the native splash and app/_layout.tsx's <Splash/>, on at least
// one real device (2026-09-11). Paired with the SplashScreen.hideAsync()
// call in app/_layout.tsx's RootLayoutNav, which fires right after that
// first frame actually commits.
import * as SplashScreen from 'expo-splash-screen';
SplashScreen.preventAutoHideAsync();

import './global.css';
import 'expo-router/entry';

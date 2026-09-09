// No react-native-firebase background message handler here (unlike
// Branzia Merchant) — this app deliberately runs inside plain Expo Go for
// now, and react-native-firebase requires a custom dev client. Push
// notifications go through expo-notifications/Expo push tokens instead
// (see services/notifications.ts) once the backend sends them.

import './global.css';
import 'expo-router/entry';

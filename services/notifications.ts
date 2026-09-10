/**
 * Push notification registration + handling.
 *
 * Uses expo-notifications' Expo push token (not a raw FCM device token
 * like Branzia Merchant) — that's what actually works inside plain Expo
 * Go, since @react-native-firebase needs a custom dev client. If SaleDM
 * later moves to a dev-client/prebuild setup, this can switch to raw FCM
 * the same way Merchant's services/notifications.ts does; until then the
 * server must send via Expo's push API, not FCM v1 directly.
 *
 * As of Expo SDK 53, expo-notifications throws *synchronously on import*
 * for Android remote-push usage inside Expo Go (it was removed from Expo
 * Go — see https://docs.expo.dev/develop/development-builds/introduction/).
 * A static `import` here would crash this whole module — and everything
 * that imports it (AuthContext, app/_layout.tsx) — before the app ever
 * renders. So it's loaded lazily via `require()` inside a try/catch and
 * every export below no-ops if that failed. This keeps the app usable in
 * plain Expo Go (per this project's CLAUDE.md); once a dev client is used,
 * the require succeeds and push works exactly as before.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as api from '@/services/api';

type NotificationsModule = typeof import('expo-notifications');
let Notifications: NotificationsModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications') as NotificationsModule;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (err) {
  console.warn('[push] expo-notifications unavailable in this runtime (Expo Go on Android as of SDK 53 has no remote push) — push notifications disabled', err);
}

async function requestPermission(): Promise<boolean> {
  if (!Notifications) return false;
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Cached so signOut() can remove exactly this device's registration
// instead of wiping every device the merchant has paired (see
// api.removePushToken). An Expo push token is stable for a given
// device+project+installation, so re-deriving it at sign-out time (see
// getCurrentExpoPushToken below) would also work, but caching the value we
// already fetched avoids an extra native call and an unnecessary
// permission check on the sign-out path.
let cachedExpoPushToken: string | null = null;

/**
 * Requests permission, fetches the current Expo push token, and registers
 * it with the Branzia Account API. Safe to call multiple times (e.g. on
 * every app launch) — the backend upserts by token, so re-registering the
 * same device is a no-op there.
 */
export async function registerForPushNotifications(): Promise<void> {
  if (!Notifications) return;
  try {
    const granted = await requestPermission();
    if (!granted) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    if (expoPushToken) {
      cachedExpoPushToken = expoPushToken;
      await api.registerPushToken(expoPushToken, Platform.OS);
    }
  } catch (err) {
    console.warn('[push] registration failed', err);
  }
}

/**
 * Removes this device's push registration from the server. Uses the token
 * cached by registerForPushNotifications() in this app session; if that
 * never ran (e.g. sign-out happens before registration ever completed),
 * falls back to no-arg removal, which clears every device the merchant has
 * paired rather than leaving this one orphaned server-side.
 */
export async function unregisterPushNotifications(): Promise<void> {
  await api.removePushToken(cachedExpoPushToken ?? undefined).catch(() => {});
  cachedExpoPushToken = null;
}

/**
 * Wires "tap a push notification → navigate to the right screen" using
 * `resolveNotificationRoute` above. Handles both:
 *  - a tap while the app is foregrounded/backgrounded (the ordinary
 *    listener), and
 *  - a cold start caused by tapping a notification (there's no listener
 *    event for that — `getLastNotificationResponseAsync()` is the only way
 *    to see it, so it's checked once up front).
 * Call once from a screen that's only mounted after the onboarding gate
 * has resolved (see app/_layout.tsx) — navigating before expo-router's
 * root layout is ready is a no-op at best.
 */
export function subscribeToNotificationTaps(navigate: (route: string) => void): () => void {
  const notifications = Notifications;
  if (!notifications) return () => {};

  const handle = (url?: string | null) => {
    const route = resolveNotificationRoute(url);
    if (route) navigate(route);
  };

  notifications.getLastNotificationResponseAsync().then((response) => {
    if (!response) return;
    handle(response.notification.request.content.data?.url as string | undefined);
    // Consume it so a remount of whatever calls this (e.g. a fast-refresh
    // during dev, or React re-mounting the subscribing component) doesn't
    // replay the same cold-start tap and navigate again.
    notifications.clearLastNotificationResponseAsync();
  });

  const subscription = notifications.addNotificationResponseReceivedListener((response) => {
    handle(response.notification.request.content.data?.url as string | undefined);
  });

  return () => subscription.remove();
}

/**
 * Maps the `data.url` sent by the Branzia Account/Instagram API to an
 * in-app expo-router route. Returns null for URLs this app doesn't have a
 * screen for. The server-side "new DM"/"new comment" push triggers were
 * removed 2026-09 along with the Inbox/Comments tabs (see
 * Social\InstagramWebhookController) — only the Lead/Sale triggers remain,
 * so only those two routes resolve here now.
 */
export function resolveNotificationRoute(url?: string | null): string | null {
  if (!url) return null;
  const leadMatch = url.match(/^\/instagram\/leads\/(\d+)$/);
  if (leadMatch) return `/leads/${leadMatch[1]}`;
  if (url === '/instagram/leads') return '/(tabs)/leads';
  // Orders has no route of its own — it's the Orders segment of the same
  // Leads+Orders screen (app/(tabs)/leads/index.tsx), selected via
  // `?tab=orders`.
  if (url === '/instagram/orders') return '/(tabs)/leads?tab=orders';
  return null;
}

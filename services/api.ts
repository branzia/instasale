import * as SecureStore from 'expo-secure-store';
import { api, app } from '@/config';

const ACCOUNT_URL = api.accountBaseUrl;
const INSTAGRAM_URL = api.instagramBaseUrl;
const TOKEN_KEY = app.storageKeys.token;
const ACCOUNT_KEY = app.storageKeys.account;

// ─── Token / cached-account helpers ────────────────────────────────────────

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(ACCOUNT_KEY);
}

export async function getCachedAccount(): Promise<Record<string, any> | null> {
  try {
    const raw = await SecureStore.getItemAsync(ACCOUNT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveAccount(account: Record<string, any>): Promise<void> {
  try {
    await SecureStore.setItemAsync(ACCOUNT_KEY, JSON.stringify(account));
  } catch {
    // non-critical — silent fail
  }
}

// ─── HTTP helper ────────────────────────────────────────────────────────────

const REQUEST_TIMEOUT_MS = 10000;

async function request(
  baseUrl: string,
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<{ status: number; data: any }> {
  const token = await getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // A hung request (unreachable host, dead TLS handshake, etc.) has no
  // built-in timeout via plain fetch() — left alone it can strand any
  // screen that awaits this (notably AuthContext's startup check) on a
  // loading state forever, with nothing printed to the terminal since
  // nothing ever throws. AbortController forces it to fail after
  // REQUEST_TIMEOUT_MS instead.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  } catch (err) {
    // Network failure / server unreachable / timed out — surfaced as
    // status 0 so callers can show a "can't reach Branzia" message
    // distinct from a real 4xx/5xx.
    if ((err as { name?: string })?.name === 'AbortError') {
      console.warn(`[api] ${method} ${path} timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    return { status: 0, data: null };
  } finally {
    clearTimeout(timeout);
  }
}

const accountRequest = (method: string, path: string, body?: Record<string, unknown>) =>
  request(ACCOUNT_URL, method, path, body);

const instagramRequest = (method: string, path: string, body?: Record<string, unknown>) =>
  request(INSTAGRAM_URL, method, path, body);

// ─── Auth (QR-scan pairing) ─────────────────────────────────────────────────
// Backend: Api\Account\PairingController — the app's only sign-in path
// (Login/Register forms were removed, 2026-09). The code was shown as a QR
// on an already-authenticated `/instagram` web session — see
// App\Filament\Instagram\Pages\ConnectMobileApp.

export const confirmPairing = (code: string) => accountRequest('POST', '/auth/pair/confirm', { code });

export const logout = () => accountRequest('POST', '/auth/logout');

export const getMe = () => accountRequest('GET', '/auth/me');

// ─── Instagram connection ──────────────────────────────────────────────────
// Backend: Api\Instagram\ConnectionController. Connecting Instagram is
// web-only now (2026-09) — this app never initiates an OAuth handshake of
// its own, it only reads/clears connection state.

export const getInstagramConnectionStatus = () => instagramRequest('GET', '/connection');

export const disconnectInstagram = () => instagramRequest('DELETE', '/connection');

// ─── Posts & Reels ──────────────────────────────────────────────────────────
// Backend: Api\Instagram\MediaController — mirrors App\Filament\Instagram\
// Pages\PostsReels (live Graph API media list + automation coverage per
// item), paginated via Meta's own cursor.

export const getInstagramMedia = (after?: string) =>
  instagramRequest('GET', after ? `/media?after=${encodeURIComponent(after)}` : '/media');

// ─── Automations ────────────────────────────────────────────────────────────
// Backend: Api\Instagram\AutomationController — full create/edit/delete
// parity with the web "Go Live" builders (App\Filament\Instagram\Pages\
// AutomationSetup for Smart/Comment automations, DmAutomationBuilder for DM
// Auto Reply), added 2026-09. `getAutomationSetup` mirrors AutomationSetup::
// mount() — pass a real Instagram media id, or the literal string 'all' for
// the account-wide entry point.

export const getAutomations = () => instagramRequest('GET', '/automations');

export const getAutomationSetup = (mediaId: string) =>
  instagramRequest('GET', `/automations/setup/${encodeURIComponent(mediaId)}`);

export const getAutomation = (id: number) => instagramRequest('GET', `/automations/${id}`);

export const saveAutomation = (payload: Record<string, unknown>) => instagramRequest('POST', '/automations', payload);

export const deleteAutomation = (id: number) => instagramRequest('DELETE', `/automations/${id}`);

export const pauseAutomation = (id: number) => instagramRequest('PATCH', `/automations/${id}/pause`);

export const resumeAutomation = (id: number) => instagramRequest('PATCH', `/automations/${id}/resume`);

/**
 * Card Message (dm_mode = 'card') image upload — the app's first multipart
 * request, so it bypasses the shared JSON-only `request()` helper above and
 * builds its own `FormData`. `Content-Type` is deliberately omitted: fetch
 * fills in the multipart boundary itself when the body is a `FormData`
 * instance, and setting it manually would drop the boundary parameter.
 */
export async function uploadAutomationCardImage(
  fileUri: string,
  fileName: string,
  mimeType: string,
): Promise<{ status: number; data: any }> {
  const token = await getToken();
  const form = new FormData();
  form.append('image', { uri: fileUri, name: fileName, type: mimeType } as unknown as Blob);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${INSTAGRAM_URL}/automations/card-image`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: form,
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  } catch {
    return { status: 0, data: null };
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Catalog: Products ──────────────────────────────────────────────────────
// Backend: Api\Instagram\ProductController — full create/edit/delete,
// mirrors App\Filament\Instagram\Clusters\LeadToSale\Resources\ProductResource's
// form exactly, including the Attributes builder (added 2026-09 — see
// components/ProductAttributeCard.tsx).

export type ProductAttributePayload = {
  source: 'predefined' | 'custom';
  predefined_id: number | null;
  label: string;
  required: boolean;
  values: { label: string; price: number }[];
};

export const getProducts = () => instagramRequest('GET', '/products');

export const createProduct = (data: {
  name: string;
  price: number;
  bulk_pricing?: { min_qty: number; unit_price: number }[];
  is_available?: boolean;
  attributes?: ProductAttributePayload[];
}) => instagramRequest('POST', '/products', data as any);

export const updateProduct = (
  id: number,
  data: {
    name: string;
    price: number;
    bulk_pricing?: { min_qty: number; unit_price: number }[];
    is_available?: boolean;
    attributes?: ProductAttributePayload[];
  },
) => instagramRequest('PUT', `/products/${id}`, data as any);

export const deleteProduct = (id: number) => instagramRequest('DELETE', `/products/${id}`);

// ─── Catalog: Attributes ────────────────────────────────────────────────────
// Backend: Api\Instagram\AttributeController — mirrors
// App\Filament\Instagram\Resources\AttributeResource's form exactly.

export const getAttributes = () => instagramRequest('GET', '/attributes');

export const createAttribute = (data: { name: string; values: string[]; is_active?: boolean }) =>
  instagramRequest('POST', '/attributes', data as any);

export const updateAttribute = (id: number, data: { name: string; values: string[]; is_active?: boolean }) =>
  instagramRequest('PUT', `/attributes/${id}`, data as any);

export const deleteAttribute = (id: number) => instagramRequest('DELETE', `/attributes/${id}`);

// ─── Leads (Lead to Sale) ───────────────────────────────────────────────────
// Backend: Api\Instagram\LeadController — read-only (Leads are only ever
// created from the dashboard or the DM chatbot, never the mobile app).

export const getLeads = () => instagramRequest('GET', '/leads');

export const getLead = (id: number) => instagramRequest('GET', `/leads/${id}`);

// ─── Sales Orders ───────────────────────────────────────────────────────────
// Backend: Api\Instagram\SalesOrderController — read-only, same reasoning as Leads.

export const getSalesOrders = () => instagramRequest('GET', '/orders');

// ─── Push token ─────────────────────────────────────────────────────────────
// Uses Expo push tokens (works inside Expo Go), not a raw FCM device
// token — see services/notifications.ts. Backend: Api\Account\
// PushTokenController, stored on the new merchants.expo_push_token column
// (deliberately separate from Branzia Store's merchants.fcm_token).

export const registerPushToken = (token: string) =>
  accountRequest('POST', '/push-token', { token, provider: 'expo' } as any);

export const removePushToken = () => accountRequest('DELETE', '/push-token');

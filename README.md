# SaleDM

The official mobile app for **Branzia Instagram Automation** — turn Instagram comments and DMs into sales, from your phone.

Branzia Instagram Automation is one of Branzia's two products (alongside Branzia Store). This app is the mobile companion to the `/instagram` Filament dashboard — see the main Website repo's `CLAUDE.md` for the full backend feature set (Comment Automation, Lead to Sale, Comment Protection, Card Messages, etc.).

---

## Status (2026-09-09)

**Onboarding flow only** — Splash → Login/Register with Google → Buy Instagram Automation → Connect Instagram → an empty Home/Inbox/Leads/Settings tab shell. None of the actual Inbox/Leads/Comments screens are built yet, and **the backend APIs this app calls don't exist yet either** — see `CLAUDE.md` in this repo for the exact list.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Expo](https://expo.dev) (SDK 54) + [React Native](https://reactnative.dev) 0.81 — runs in plain **Expo Go**, no dev client/prebuild yet |
| Navigation | [Expo Router](https://expo.github.io/router) v6 (file-based routing) |
| Styling | [NativeWind](https://www.nativewind.dev) v4 (Tailwind CSS for React Native) |
| Auth | Google Sign-In via `expo-auth-session` (id_token → backend verifies + issues a Bearer token) |
| Auth storage | [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) |
| Push | `expo-notifications` + Expo push tokens (not raw FCM — see `services/notifications.ts`) |
| API | Branzia Account API + Branzia Instagram API (planned — not live yet) |

## Getting Started

```
npm install
npx expo install --check   # fixes any Expo SDK 54 version mismatches
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android). No native build step required.

## Project Structure

```
app/
  _layout.tsx            Root — onboarding gate (splash → auth → buy → connect → tabs)
  (auth)/                Login, Register (Google)
  (onboarding)/           Buy Instagram Automation, Connect Instagram
  (tabs)/                 Home, Inbox, Leads, Settings (Inbox/Leads are stubs)
config/                   brand.js (Instagram gradient theme), api.ts, app.ts, colors.ts
context/AuthContext.tsx   token + account + product-access + instagram-connection state
hooks/useGoogleAuth.ts    expo-auth-session Google wrapper
services/api.ts           HTTP client — see TODO(backend) comments for unbuilt endpoints
services/notifications.ts Expo push token registration
```

See `CLAUDE.md` for the full list of backend work this app is waiting on.

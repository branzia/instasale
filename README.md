# InstaSale

The official mobile app for **Branzia Instagram Automation** — turn Instagram comments and DMs into sales, from your phone.

Branzia Instagram Automation is one of Branzia's two products (alongside Branzia Store). This app is the mobile companion to the `/instagram` Filament dashboard — see the main Website repo's `CLAUDE.md` for the full backend feature set (Comment Automation, Lead to Sale, Comment Protection, Card Messages, etc.).

---

## Status (2026-09-09)

<<<<<<< HEAD
**Rebuilt around QR-scan sign-in and a reduced, focused screen set**, backed by real Laravel APIs (see this repo's `CLAUDE.md` for the full endpoint table):
- Splash → scan a QR code shown on the Branzia web dashboard (`branzia.app/instagram` → Connect Mobile App) → Buy Instagram Automation → wait for Instagram to be connected on the web
- Home — a simple connection-status card, no counters
- Posts & Reels — live Instagram media list with an automation-coverage tag
- Automations — read-only list + summary counts, one-tap Pause/Resume
- Leads + Orders — real Lead to Sale data, share payment link
- Catalog — Products + Attributes, full create/edit/delete
- Settings — profile, disconnect Instagram, sign out
- **Push notifications** deliver for new lead and new sale (Expo push, not FCM)

**Removed** (explicit product-scope decisions, not gaps): Login/Register forms, in-app Instagram OAuth connect, Inbox, Comments, Payment Settings, Comment Protection, dashboard stat counters. Instagram connection and those settings now live exclusively on the web dashboard.

**Not yet built**: Card Message config, Automation Setup (the "Go Live" rule-building wizard), real in-app payment, iOS, on-device testing (including the camera QR scanner). See `CLAUDE.md`'s "What's built vs. what's NOT" section.
=======
**Onboarding flow only** — Splash → Login/Register with Google → Buy Instagram Automation → Connect Instagram → an empty Home/Inbox/Leads/Settings tab shell. None of the actual Inbox/Leads/Comments screens are built yet, and **the backend APIs this app calls don't exist yet either** — see `CLAUDE.md` in this repo for the exact list.
>>>>>>> origin/main

## Tech Stack

| Layer | Technology |
|-------|-----------|
<<<<<<< HEAD
| Framework | [Expo](https://expo.dev) (SDK 57) + [React Native](https://reactnative.dev) — runs in plain **Expo Go**, no dev client/prebuild yet |
| Navigation | [Expo Router](https://expo.github.io/router) (file-based routing) |
| Styling | [NativeWind](https://www.nativewind.dev) (Tailwind CSS for React Native) |
| Auth | QR-scan pairing — `expo-camera` scans a code shown on an already-authenticated Branzia web session, exchanged for a Bearer token. No typed credentials anywhere in the app. |
| Auth storage | [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) |
| Push | `expo-notifications` + Expo push tokens (not raw FCM — see `services/notifications.ts`) |
| API | Branzia Account API + Branzia Instagram API (`/api/account/*`, `/api/instagram/*`) |
=======
| Framework | [Expo](https://expo.dev) (SDK 54) + [React Native](https://reactnative.dev) 0.81 — runs in plain **Expo Go**, no dev client/prebuild yet |
| Navigation | [Expo Router](https://expo.github.io/router) v6 (file-based routing) |
| Styling | [NativeWind](https://www.nativewind.dev) v4 (Tailwind CSS for React Native) |
| Auth | Google Sign-In via `expo-auth-session` (id_token → backend verifies + issues a Bearer token) |
| Auth storage | [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) |
| Push | `expo-notifications` + Expo push tokens (not raw FCM — see `services/notifications.ts`) |
| API | Branzia Account API + Branzia Instagram API (planned — not live yet) |
>>>>>>> origin/main

## Getting Started

```
npm install
<<<<<<< HEAD
npx expo install --check   # fixes any Expo SDK version mismatches
=======
npx expo install --check   # fixes any Expo SDK 54 version mismatches
>>>>>>> origin/main
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android). No native build step required.

## Project Structure

```
app/
<<<<<<< HEAD
  _layout.tsx             Root — onboarding gate (splash → scan → buy → wait for Instagram → tabs)
  (auth)/                 scan.tsx — QR-scan sign-in (no Login/Register forms)
  (onboarding)/            Buy Instagram Automation, Instagram-required wait screen
  (tabs)/
    index.tsx             Home — connection status only
    posts.tsx             Posts & Reels — live media list
    automations.tsx        Automations — read-only + Pause/Resume
    leads/                 Stack: leads+orders segmented list → lead detail
    catalog/                Stack: products+attributes segmented list → product/attribute form
    settings/               Stack: profile/sign-out
config/                   brand.js (Instagram gradient theme), api.ts, app.ts, colors.ts
context/AuthContext.tsx   token + account + product-access + instagram-connection state
services/api.ts           HTTP client — matches the live backend endpoint table in CLAUDE.md
services/notifications.ts Expo push token registration (delivery is server-side — see CLAUDE.md)
```

See `CLAUDE.md` for the full backend endpoint table and what's still unbuilt.
=======
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
>>>>>>> origin/main

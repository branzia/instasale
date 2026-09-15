# InstaSale

The official mobile app for **Branzia Instagram Automation** — turn Instagram comments and DMs into sales, from your phone.

Branzia Instagram Automation is one of Branzia's two products (alongside Branzia Store). This app is the mobile companion to the `/instagram` Filament dashboard — see the main Website repo's `CLAUDE.md` for the full backend feature set (Comment Automation, Lead to Sale, Comment Protection, Card Messages, etc.).

---

## Status (2026-09-11)

**Rebuilt around QR-scan sign-in and a reduced, focused 4-tab screen set**, backed by real Laravel APIs (see this repo's `CLAUDE.md` for the full endpoint table):
- Splash → scan a QR code shown on the Branzia web dashboard (`branzia.app/instagram` → Connect Mobile App) → wait for Instagram to be connected on the web (no in-app OAuth, no purchase gate)
- Home — connection-status card, no counters, plus labeled rows to Catalog and Settings
- Posts & Reels — live Instagram media list with an automation-coverage tag and filter pills
- Automations — list + summary counts, one-tap Pause/Resume/Delete, and full "Go Live" rule builders (Comment Automation + DM Automation)
- Leads + Orders — real Lead to Sale data, share payment link
- Catalog — Products + Attributes, full create/edit/delete, reached from Home
- Settings — account info, disconnect Instagram, sign out, reached from Home
- **Push notifications** deliver for new lead and new sale, to every device a merchant has paired (Expo push, not FCM)

**Removed** (explicit product-scope decisions, not gaps): Login/Register forms, in-app Instagram OAuth connect, the "Buy Instagram Automation" access gate, Inbox, Comments, Payment Settings, Comment Protection, dashboard stat counters. Instagram connection and those settings now live exclusively on the web dashboard.

**Not yet built**: real in-app payment, staff access, password reset, iOS, and on-device testing (including the camera QR scanner). See `CLAUDE.md`'s "What's built vs. what's NOT" section.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Expo](https://expo.dev) (SDK 57) + [React Native](https://reactnative.dev) 0.86 — runs in plain **Expo Go**, no dev client/prebuild |
| Navigation | [Expo Router](https://expo.github.io/router) (file-based routing) |
| Styling | [NativeWind](https://www.nativewind.dev) v4 (Tailwind CSS for React Native) |
| Auth | QR-scan pairing — `expo-camera` scans a code shown on an already-authenticated Branzia web session, exchanged for a Bearer token. No typed credentials anywhere in the app. |
| Auth storage | [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) |
| Push | `expo-notifications` + Expo push tokens, one row per paired device (not raw FCM — see `services/notifications.ts`) |
| API | Branzia Account API + Branzia Instagram API (`/api/account/*`, `/api/instagram/*`) |

## Getting Started

```
npm install
npx expo install --check   # fixes any Expo SDK version mismatches
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android). No native build step required.

## Project Structure

```
app/
  _layout.tsx             Root — onboarding gate (splash → scan → wait for Instagram → tabs)
  index.tsx               Route for bare "/" on a cold app launch — renders nothing
  (auth)/                 scan.tsx — QR-scan sign-in (no Login/Register forms)
  (onboarding)/           instagram-required.tsx — passive "connect on the web" wait screen
  (tabs)/                 4 tabs: Home, Posts & Reels, Automations, Leads
    home/                 Stack: connection status + links → catalog, account-settings, product/attribute forms
    posts.tsx             Posts & Reels — live media list
    automations/           Stack: list → comment-builder.tsx, dm-builder.tsx (Go Live rule builders)
    leads/                 Stack: leads+orders segmented list → lead detail
config/                   brand.js (Instagram gradient theme), api.ts, app.ts, colors.ts
context/AuthContext.tsx   token + account + instagram-connection state
components/               shared UI: Card, Segment, EmptyState, StatusBadge, RuleCard, etc.
services/api.ts           HTTP client — matches the live backend endpoint table in CLAUDE.md
services/notifications.ts Expo push token registration + tap-to-navigate (delivery is server-side — see CLAUDE.md)
```

See `CLAUDE.md` for the full backend endpoint table and what's still unbuilt.

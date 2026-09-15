# InstaSale — Instagram Automation Mobile App

## What is this?
A mobile app for **Branzia merchants** to run Branzia's "Instagram Automation" product (comment automation, DM chatbot, Lead to Sale, payments) from their phone. This app talks to Branzia's REST APIs — it does NOT talk to any database directly, and it does NOT reuse the Branzia Merchant app's `/api/merchant/*` API (that's Branzia Store's mobile API, a separate product — see the main Website repo's `CLAUDE.md`).

**Sibling project**: `D:\Live Website\Branzia\Merchant` (Branzia Store's mobile app) — InstaSale's tooling (Expo/Expo Router/NativeWind version pins, config/ layout, context/AuthContext shape, services/api.ts conventions) deliberately mirrors it wherever the two aren't forced apart by a real difference. Check Merchant first before introducing a new pattern here.

## Deliberate difference from Merchant: plain Expo Go, not a dev client
Merchant uses `@react-native-firebase/messaging` + `expo-build-properties` + a committed `android/` folder — none of that runs inside plain Expo Go, it needs a custom dev client / prebuild. **InstaSale is built to run in Expo Go** for as long as possible:
- Push notifications use `expo-notifications` + **Expo push tokens**, not raw FCM device tokens. If a real native module is ever required, that's a deliberate escalation to make explicitly (and this note should be updated/removed then) — not something to reach for by default.
- `expo-camera` (added 2026-09-09 for the QR-scan sign-in screen — see "QR-scan login" below) and `expo-image-picker` (added 2026-09-09 for the Comment Automation builder's Card Message image field — see "Automation builders" below) are both native modules Expo Go itself bundles support for, so neither forces a dev-client escalation either.
- There is no external-auth handshake of any kind in this app anymore — no Google Sign-In (see below), no in-app Instagram OAuth (`expo-web-browser`'s `openAuthSessionAsync` usage was removed the same day the QR-scan rebuild shipped — see "QR-scan login" above). Both sign-in and Instagram connection now happen entirely on the web dashboard; the app only ever scans a code or reads status.

## Google Sign-In — removed (2026-09), then email/password itself replaced by QR-scan pairing (2026-09-09)

InstaSale originally shipped Google-only auth (`expo-auth-session`, `androidClientId`/`webClientId`/`iosClientId` in `config/app.ts`, `hooks/useGoogleAuth.ts`, `components/GoogleButton.tsx`, backend `POST /auth/google`/`/auth/google/register`). Removed per explicit user call in favor of email/password Login+Register. That email/password UI was itself removed the same day as the rest of this doc's "QR-scan login" section above — there is now no typed-credential sign-in screen in this app at all.

**What's gone from this repo**: `hooks/useGoogleAuth.ts`, `components/GoogleButton.tsx`, the `google` block in `config/app.ts`, the `expo-auth-session` package (uninstalled), `services/api.ts`'s `loginWithGoogle`/`registerWithGoogle`/`login`/`register` exports, and `app/(auth)/login.tsx`/`register.tsx` themselves.

**What's NOT gone** (deliberately, generic infra — see `Api\Account\AuthController`'s docblock in the Website repo): the backend's `POST /api/account/auth/google`/`/auth/google/register`/`/login`/`/register` endpoints and `GoogleIdTokenVerifier` service still exist, unused by InstaSale's UI (a brand-new Merchant with zero prior account still registers via the web `/my-account` flow, then pairs the app from there). Don't wire any of this back into this app's UI without checking with the user first — these were deliberate removals, not something left half-done.

## Brand theme
**Not Branzia green.** This app uses an Instagram-inspired gradient (blue → purple → magenta → pink → orange → yellow, `config/brand.js`'s `gradient` export) because the product is about Instagram, and a competing-app naming convention (other Instagram-DM tools go by names like "Quick DM"/"Send DM") drove dropping the "Branzia" prefix from the product-facing name too — see "App name" below. Tailwind's `brand` color scale (`tailwind.config.js`) is built around Instagram magenta `#C13584`, not Branzia's `#1D9E75`. NativeWind can't render a true multi-stop gradient via a class, so anywhere the actual gradient is needed (buttons, splash, hero) uses `expo-linear-gradient` directly with `config/brand.js`'s `gradient`/`gradientShort` arrays — don't try to fake it with a Tailwind class.

## App name
**InstaSale** (not "Branzia InstaSale" or "Branzia Instagram") — user's explicit call: sibling apps in this space go by short, sales-focused names without a company prefix (Quick DM, Send DM). Package/bundle id is still `com.branzia.InstaSale` (namespacing at the store level, not the product name shown to users).

## UI redesign & shared components (2026-09-09)

All 6 tab screens (Home, Posts & Reels, Automations, Leads+Orders, Catalog, Settings) were rebuilt against a small shared component set, replacing code that had been duplicated per-screen and swapping the app's emoji-as-icons for real icons everywhere, including the tab bar.

**Icon library**: `@expo/vector-icons` (Ionicons), added as an explicit dependency (`npx expo install @expo/vector-icons` — it's not bundled by the `expo` package itself and needed adding). Its only runtime dependency is `expo-font`, already present transitively via `expo-router`, so this doesn't force any dev-client/prebuild escalation — see "Deliberate difference from Merchant" above. Follows the outline/filled pairing convention already used in the sibling Merchant app's tab bar (`focused ? 'home' : 'home-outline'`, etc.).

**New shared components** (`components/`), each replacing code that used to be duplicated inline across 2+ screens:
- `Segment.tsx` — pill-toggle segmented control (Leads/Orders, Catalog's Products/Attributes), active pill filled with `gradientShort` instead of flat brand color.
- `EmptyState.tsx` — centered "nothing here yet" state (icon + title + body) used by every list screen.
- `StatusBadge.tsx` — pill badge reading `config/colors.ts`'s `statusColors` map, which now also covers Automation `active`/`paused` statuses (previously a separate local `STATUS_STYLE` map on the Automations screen only).
- `Checkbox.tsx` — shared checkbox row (both Catalog forms).
- `DetailRow.tsx` — key/value row (Lead detail).
- `Card.tsx` — the `bg-gray-50 rounded-2xl p-4` list-row/section shell repeated everywhere; only the outer shell is shared, each screen keeps its own internal row layout.
- `ScreenHeader.tsx` — "big title + optional right-side action" header; the action button (when present, e.g. Catalog's add button) is a small `gradientShort`-filled circle.
- `SolidButton.tsx` — sibling to `GradientButton` for secondary/plain actions (Sign Out, Delete) — `GradientButton` itself is unchanged, still the only gradient CTA.
- `utils/confirm.ts`'s `confirmDelete()` — the destructive-delete `Alert.alert` pattern, previously duplicated identically in both Catalog forms.

This was a visual/structural redesign, not a features pass — it doesn't add anything to the "Built" list beyond what's described here (no Card Message config, no Automation Setup wizard, no real payment UI — see "What's built vs. what's NOT" below, those boundaries didn't move).

## Onboarding flow (rebuilt 2026-09-09 — QR-scan login, no in-app Instagram connect; Buy gate dropped same day)

```
Splash (shown while AuthContext resolves the stored token)
  ↓
(auth) — not signed in
  Scan → camera QR scanner → POST /auth/pair/confirm
    (the code is shown on an already-authenticated /instagram web session,
    App\Filament\Instagram\Pages\ConnectMobileApp — there is NO Login or
    Register form in this app at all)
  ↓
(onboarding)/instagram-required — signed in, but !isInstagramConnected
  Passive wait screen: "Connect Instagram on the Web" + "I've Connected —
  Check Again" → GET /connection. There is no in-app OAuth flow anymore —
  connecting Instagram only ever happens on the web dashboard.
  ↓
(tabs) — Home (+ Catalog and Settings, one tap away via labeled rows under the hero) / Posts & Reels / Automations / Leads (+Orders segment)
```
The gate lives entirely in `app/_layout.tsx`'s `RootLayoutNav` — it redirects forward/back based on `AuthContext`'s `token` / `isInstagramConnected`, and never fights a location that's already correct (it lands on `/(tabs)/home` explicitly now — see "Footer reduced from 6 to 4 tabs" below for why `/(tabs)` alone stopped resolving). Don't scatter this logic into individual screens. Note: disconnecting Instagram from Home's Settings screen flips `isInstagramConnected` back to false, which this same gate correctly bounces the merchant back to `(onboarding)/instagram-required` for — that's intentional, not a bug to "fix".

### Footer reduced from 6 to 4 tabs (2026-09-09)

Per explicit user call, the tab bar (`app/(tabs)/_layout.tsx`) went from 6 items to 4: **Home, Posts & Reels, Automations, Leads**. Settings and Catalog are gone as standalone tabs, but neither got folded into another tab's main content — two earlier attempts at that were both explicit user corrections:
- Inlining Settings' Account/Instagram-disconnect/Sign-Out section directly into Home's scrollable body was rejected — a destructive-ish action (Disconnect Instagram, Sign Out) sitting in a scrolling feed risks an accidental tap.
- Folding Catalog into Automations as a `Segment` toggle was rejected too — even though the two are functionally coupled (the DM builder's Chatbot mode reads a linked product, the comment-builder's Product step is literally "pick a catalog product"), Catalog is a full CRUD resource and didn't belong bolted onto a different tab's primary content.

What actually shipped: **Home became a small stack** (`app/(tabs)/home/`, replacing the old flat `app/(tabs)/index.tsx` — hence `RootLayoutNav` now redirects to `/(tabs)/home` explicitly, since `/(tabs)` alone no longer resolves to anything) with two `LinkRow`s (icon + title + one-line description + chevron, `home/index.tsx`) sitting just under the connection-status hero, pushing to `home/catalog.tsx` and `home/account-settings.tsx` respectively. These started as two bare icon buttons in Home's header, next to the merchant's name — also a user correction: unlabeled icons up there weren't discoverable, so they moved down under the hero and each gained a title + description of what it actually does. Both destination screens' content is otherwise unchanged from the old `catalog/` and `settings/` tabs; `product-form.tsx`/`attribute-form.tsx` moved from `catalog/` to `home/` alongside `catalog.tsx`, registered as extra `Stack.Screen`s in `home/_layout.tsx`. `app/(tabs)/catalog/` and `app/(tabs)/settings/` are both gone.

Don't revive either as a full tab, or re-inline either into another tab's main content, without checking with the user first — this shape was arrived at by correction, not a first guess.

### "Buy Instagram Automation" — access gate removed (2026-09-09)

Per explicit user call, the third onboarding step (`(onboarding)/buy`, gated on `!hasInstagramAccess`) is gone entirely — a signed-in merchant now goes straight from `(auth)/scan` to the `isInstagramConnected` check. **What's gone**: `app/(onboarding)/buy.tsx` itself, `AuthContext`'s `hasInstagramAccess`/`setHasInstagramAccess` (and all 4 places that used to derive it from `account.can_access_instagram` — boot-restore-from-cache, boot-refresh-via-`getMe`, `signIn()`, `refreshAccount()`), and `services/api.ts`'s `getProductAccess` export. **What's NOT gone** (same "kept server-side, unused by this app's UI" convention as the Google Sign-In endpoints above): the backend's `GET /api/account/products/{key}/access` endpoint and `Api\Account\ProductAccessController` still exist — this app's UI just never calls them anymore. Don't wire this back into the UI without checking with the user first.

### QR-scan login — why, and how it actually works

Removed 2026-09-09, explicit user call: Login/Register forms (email/password) and the in-app "Connect Instagram" OAuth screen (`expo-web-browser`'s `openAuthSessionAsync` against `Http\Controllers\Instagram\MobileConnectBridgeController`, which was deleted server-side along with this). The merchant is always already authenticated on the `/instagram` web panel before they'd ever want the app, so sign-in is now: open `branzia.app/instagram` → "Connect Mobile App" page shows a QR code (`InstaSale://pair?code=...`, regenerated every 2 minutes) → scan it in `(auth)/scan.tsx` (`expo-camera`'s `CameraView`) → `POST /api/account/auth/pair/confirm` exchanges the code for the same `{token, account}` shape `login()`/`register()` used to return. `App\Models\Merchant\MobilePairingCode` is the backing table (single-use, 2-minute expiry, one active code per merchant at a time).

Instagram connection follows the same "web is the source of truth" principle now: `(onboarding)/instagram-required` never initiates a connect — it only reads `GET /connection` and tells the merchant where to go. `Api\Instagram\ConnectionController::connectUrl()` and the whole mobile-bridge controller are gone; `status()`/`disconnect()` remain.

### Removed screens (2026-09-09) — Inbox, Comments, Payment Settings, Comment Protection, dashboard stats

Per explicit user call, these are gone from the app (their backend endpoints mostly remain as unused/generic API surface — see the endpoint table below):
- **Inbox** and **Comments** tabs — deleted outright. `Api\Instagram\ContactController`/`CommentController` still exist server-side but nothing in this app calls them. The "new DM"/"new comment" push triggers were also removed server-side (`Social\InstagramWebhookController`) since there's no screen left to tap into.
- **Settings → Payment Settings** and **Settings → Comment Protection** — deleted. Configure these from the web dashboard instead. `Api\Instagram\PaymentSettingController`/`CommentProtectionController` still exist server-side, unused by this app. (Settings itself outlived this by a few hours as its own tab before losing the tab — see "Footer reduced from 6 to 4 tabs" above — it's a screen reached from Home's gear icon now, not gone.)
- **Home dashboard stats** (`Api\Instagram\DashboardController`, the 4 StatCards) — the controller was deleted entirely. Home now shows nothing but a connection-status card, read straight from `AuthContext` (no API call).

## Backend APIs — rebuilt 2026-09-09, all in the Website Laravel repo
All Bearer/Sanctum-authenticated via `App\Http\Middleware\AuthenticateAccountApi` (a separate guard from Branzia Store's `AuthenticateMerchantApi` — see that class's docblock) unless noted public:

| Endpoint | Purpose | Backend controller |
|---|---|---|
| `POST /api/account/auth/pair/confirm` (public, throttled) | Exchanges a QR-scan pairing code for `{ token, account }` — the app's only sign-in path | `Api\Account\PairingController::confirm` |
| `POST /api/account/auth/logout` / `GET /api/account/auth/me` | | `Api\Account\AuthController` |
| `POST`/`DELETE /api/account/push-token` | Expo push token, stored one-row-per-device in `merchant_push_tokens` (2026-09-10 — replaced the earlier single `merchants.expo_push_token` column so a merchant paired on several phones gets push on all of them) | `Api\Account\PushTokenController` |
| `GET`/`DELETE /api/instagram/connection` | Connection status / disconnect (connecting itself is web-only) | `Api\Instagram\ConnectionController` |
| `GET /api/instagram/media` (`?after=`) | Posts & Reels — live Graph API media + per-item automation coverage, mirrors `App\Filament\Instagram\Pages\PostsReels` | `Api\Instagram\MediaController::index` |
| `GET /api/instagram/automations` | List + summary counts, mirrors `AllAutomations` | `Api\Instagram\AutomationController::index` |
| `GET /api/instagram/automations/setup/{mediaId}` | Comment Automation builder hydration — `{mediaId}` is a real Instagram media id or the literal `all`; mirrors `AutomationSetup::mount()`, returns both scope snapshots | `Api\Instagram\AutomationController::setupForMedia` |
| `GET /api/instagram/automations/{id}` | Generic single-automation detail (the DM builder's edit path) | `Api\Instagram\AutomationController::show` |
| `POST /api/instagram/automations` | Create-or-update for both types (`type: comment\|dm`) — Save Draft / Go Live, mirrors `AutomationSetup`/`DmAutomationBuilder`'s own create-or-update methods; `422 { blockers }` when Go Live is rejected by `AutomationValidator` | `Api\Instagram\AutomationController::store` (via `Services\Instagram\Api\{CommentAutomationApiService,DmAutomationApiService}`) |
| `POST /api/instagram/automations/card-image` | Card Message (`dm_mode: card`) image upload, multipart | `Api\Instagram\AutomationController::uploadCardImage` |
| `PATCH /api/instagram/automations/{id}/pause`\|`/resume` | One-tap lifecycle actions via `AutomationLifecycleService` | `Api\Instagram\AutomationController` |
| `DELETE /api/instagram/automations/{id}` | Delete (soft-delete, keeps execution history) | `Api\Instagram\AutomationController::destroy` |
| `GET/POST/PUT/DELETE /api/instagram/products` | Catalog products — full CRUD incl. the Attributes builder, mirrors `ProductResource` + `_attributes.blade.php` exactly (added 2026-09) | `Api\Instagram\ProductController` |
| `GET/POST/PUT/DELETE /api/instagram/attributes` | Catalog attributes — full CRUD, mirrors `AttributeResource` | `Api\Instagram\AttributeController` |
| `GET /api/instagram/leads` / `GET /api/instagram/leads/{id}` | Read-only Lead to Sale data (leads are only ever created from the dashboard or the DM chatbot — never from this app) | `Api\Instagram\LeadController` |
| `GET /api/instagram/orders` | Read-only Sales Orders (only ever written by `LeadPaymentController`) | `Api\Instagram\SalesOrderController` |

**Kept server-side but no longer called by this app** (generic API surface, same "not wired into current UI but not deleted" convention as `loginWithGoogle`/`registerWithGoogle`) — `Api\Instagram\ContactController` (Inbox), `CommentController` (Comments), `PaymentSettingController`, `CommentProtectionController`, and (as of 2026-09-09) `Api\Account\ProductAccessController` (see "Buy Instagram Automation — access gate removed" above). **Actually deleted**: `Api\Instagram\ConnectionController::connectUrl()`, `Api\Instagram\DashboardController` (whole class), `Http\Controllers\Instagram\MobileConnectBridgeController` (whole class + its 2 web routes).

`services/api.ts` mirrors the live table exactly — extend both together if this ever drifts.

### Push notification delivery
`App\Services\ExpoPushService::sendToMerchant()` (mirrors `FcmService`'s logs-and-returns-false-never-throws convention, but posts to Expo's push API, not FCM — see `merchant_push_tokens` above) fans a single event out to every device that merchant has registered (batched, up to 100 tokens per Expo request; a `DeviceNotRegistered` reply auto-prunes that row). Wired into 2 real trigger points, each via `defer()` so it never blocks the request that triggered it:
- New chatbot-created Lead (`ProductSalesConversationService::handleConfirmation()`, the YES branch) — no gate needed, `Lead::create()` is never a duplicate.
- New paid/confirmed sale (`Instagram\LeadPaymentController::verify()`/`confirmManual()`, right after each `SalesOrder::create()`).

The former "new inbound DM"/"new inbound comment" triggers were removed 2026-09-09 along with the Inbox/Comments tabs — there's no screen left to tap into. Manually-created Leads (`LeadResource` on the web dashboard) still don't trigger a push — only the two automated-creation/confirmation paths above do.

**Multi-device (2026-09-10).** QR-scan login has no single-device limit — a merchant can pair InstaSale on several phones, each getting its own Sanctum token. Each device's own Expo push token is cached in `services/notifications.ts` at registration time; `AuthContext.signOut()` → `unregisterPushNotifications()` sends that specific token to `DELETE /api/account/push-token`, so signing out one device only removes that device's registration — the other paired phones keep receiving push. If a device never completed registration this session (e.g. sign-out happens before `registerForPushNotifications()` ran), removal falls back to no-arg (server clears every device for that merchant) rather than leaving an orphaned row.

**Tap-to-navigate.** `services/notifications.ts#resolveNotificationRoute` maps each trigger's `data.url` to an in-app route: `/instagram/leads`(`/{id}`) → Leads tab (or lead detail), `/instagram/orders` → the Leads tab's Orders segment via `?tab=orders` (`app/(tabs)/leads/index.tsx` reads it through `useLocalSearchParams` to pick the initial segment — Orders has no route of its own, it's a segment of the same screen). `subscribeToNotificationTaps()` (same file) wires this to both a live tap (`addNotificationResponseReceivedListener`) and a cold-start tap (`getLastNotificationResponseAsync()`, consumed via `clearLastNotificationResponseAsync()` so it never replays on remount) — called once from `app/_layout.tsx`'s `RootLayoutNav`, gated on the same "fully onboarded" condition as the redirect gate itself, so a tap never lands mid-onboarding-flow only to get bounced back out.

### India-only pricing display (temporary)
Lead prices/totals are shown with a hardcoded `₹` in the Leads screens — Instagram Automation's Lead to Sale payment gateways (Razorpay/UPI/COD) are India-first with no multi-currency concept documented yet, unlike Branzia Store's `currency_symbol`. Revisit if/when Instagram Automation gets international currency support.

## What's built vs. what's NOT (don't assume otherwise)
**Built**: onboarding (Splash / QR-scan sign-in / Instagram-required wait screen — see "QR-scan login" above; access is no longer gated, see "Buy Instagram Automation — access gate removed"), Home (connection-status hero card, no counters, plus — since the footer reduction below — two labeled rows under the hero pushing to Catalog and Settings, each unchanged from their old standalone-tab selves), Posts & Reels (live Graph API media list, paginated, automation-coverage tag, an "Any post or reel" account-wide entry card, and All/Automated/Not automated/Reels-only filter pills — mirrors `PostsReels`), Automations (list + summary counts + one-tap Pause/Resume/Delete + full "Go Live" rule builders — see below), Leads+Orders (segmented list + lead detail + share payment link), Catalog (Products + Attributes, full create/edit/delete, segmented list; the Product form's own Attributes builder — see below — is full parity with the web, not just name/price/bulk pricing), Settings (account info, Instagram status + disconnect, sign out — Payment Settings/Comment Protection removed). Push notification **delivery** for 2 events (new lead, new sale) — see "Push notification delivery" above.

**Product Attributes (added 2026-09-09)** — `app/(tabs)/home/product-form.tsx` (moved from `catalog/product-form.tsx` — see "Footer reduced from 6 to 4 tabs" above) mirrors `_attributes.blade.php`'s Alpine builder exactly: a "Question for buyer" label (editable regardless of source), Required, and an options list where each option has a label + either "Default price" (0) or a real price add-on. Buttons at the bottom add either a reusable attribute (one "+ {name}" chip per active `instagram_attributes` row, disabled once already attached, prefilling its option list) or a fresh "+ Custom Attribute" (blank, no `predefined_id`). New shared component `components/ProductAttributeCard.tsx`. Backend: `Api\Instagram\ProductController` now `use`s the same `ProductResource\Concerns\SyncsAttributes` trait `CreateProduct`/`EditProduct` call — reused directly rather than duplicated, since `cleanAttributeSnapshot()` has zero Filament/Livewire coupling (plain array in, plain array out).

**Automation builders (added 2026-09-09)** — full parity with the web "Go Live" wizards, previously the last major web-only surface:
- `app/(tabs)/automations/comment-builder.tsx` — mirrors `App\Filament\Instagram\Pages\AutomationSetup` exactly: Setup (This post / Any post or reel scope, hydrated via `GET /automations/setup/{mediaId}` which returns both scope snapshots so switching scope never loses in-progress edits, same as the web builder's `selectScope()`), Rules (reorderable keyword rules + a single optional "Any Comment" fallback, each with Reply Publicly + Send DM in one of three modes — Custom text / Chatbot [reads the linked product] / Card [image via `expo-image-picker` → `POST /automations/card-image`, headline, description, button]), Product (link a catalog product — required for Chatbot mode), Advanced (once-per-user, Send Delay). Reached from Posts & Reels's "Ready to setup"/"Edit Automation" button (always keyed by Instagram media id, never by this automation's own id — mirrors `media-card.blade.php`'s `$setupUrl`) or the "Any post or reel" card (`?mediaId=all`).
- `app/(tabs)/automations/dm-builder.tsx` — mirrors `DmAutomationBuilder`: Trigger (keywords vs. the single Any Message fallback) → reply message text → Name.
- Both: Save Draft / Go Live via `POST /automations`; a `422 { blockers }` response (mirroring `AutomationValidator`) is shown verbatim, nothing is persisted on a rejected Go Live, exactly like the web builders.
- New shared component `components/RuleCard.tsx` (the rule editor card, used for both keyword rules and the Any Comment fallback).

**Visual/structural redesign (2026-09-09)**: all 6 tab screens were rebuilt against a small shared component set — see "UI redesign & shared components" below — replacing per-screen duplicated code (segmented toggles, empty states, status badges, checkboxes) and swapping the app's emoji-as-icons for real `@expo/vector-icons` (Ionicons) icons throughout, including the tab bar.

**Not built**:
- Real in-app payment — Instagram Automation access is no longer gated in this app at all (see "Buy Instagram Automation — access gate removed" above), so there is nothing left to pay for from the app; any future paid upsell would need its own new gate/screen, not a revival of the old Buy flow.
- Staff access — Merchant/Owner-only for now, matching Instagram Automation's own "Staff is on hold" status in the Website repo (and the user's explicit "No staff" call on this app specifically).
- Password reset ("forgot password") — meaningless now that there's no password-based login at all; a Merchant who's ever locked out of the app just re-scans a fresh QR code from the web dashboard.
- Real on-device testing generally — only `tsc --noEmit` + `expo export` bundle-verified so far, never run in an emulator/physical device. The camera QR scanner (`expo-camera`) in particular has not been verified on a real device/emulator.
- Inbox, Comments, Payment Settings, Comment Protection, and dashboard stats — deliberately removed 2026-09-09, not a gap. See "Removed screens" above.

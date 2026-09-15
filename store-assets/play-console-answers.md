# Play Console policy forms — draft answers

Drafted from this app's actual functionality (per the project's own
`CLAUDE.md`). These are **legal declarations about your business** —
review and correct anything marked `[CONFIRM]` before submitting; don't
paste this in blind.

---

## Content rating (IARC questionnaire)

App category to select: **Utility / Productivity / Business** (not
"Social" — the app doesn't let its own users interact with each other;
it's a merchant managing their own Instagram business data).

Answer **No** to all of: violence, sexual content, profanity, gambling
(real or simulated), controlled substances, user-generated content
shared publicly. The only borderline question is usually phrased like
"Does the app allow users to interact or exchange content?" — answer
**No**: comments/DMs shown in-app are the merchant's own Instagram data
pulled from Meta's Graph API, not content created *inside* InstaSale and
shared with other InstaSale users.

Expected result: **PEGI 3 / Everyone**, since it's a single-tenant
business tool.

## Target audience & content

- Target age group: **18 and over** (it's a merchant/business tool —
  not designed for or targeted at children). Do **not** select any
  child age range even as a secondary audience.
- "Is your app primarily child-directed?" → **No**.

## Ads

**No ads** — InstaSale has no ad SDK integrated.

## Data safety form

Based on what this app's API surface actually touches (`services/api.ts`,
the `Api\Instagram\*`/`Api\Account\*` controllers):

| Data type | Collected? | Shared with 3rd party? | Purpose |
|---|---|---|---|
| Name, email, phone (merchant account) | Yes | No | Account management, app functionality |
| Name, email, phone (Leads — the merchant's own customers) | Yes | No | App functionality (shown to the merchant only) |
| Financial info (Lead to Sale order totals/payment status) | Yes | `[CONFIRM]` — depends on whether Razorpay/payment gateway counts as a declared 3rd party in your data-sharing terms | App functionality |
| Messages (Instagram comments/DM content, read via Graph API) | Yes | No (Meta is the origin, not a recipient you share *to*) | App functionality |
| App activity / device ID | Only for Expo push token, tied to push notifications | No | App functionality (push delivery) |
| Photos (Card Message image uploads) | Yes, merchant-uploaded | No | App functionality |

- Data encrypted in transit: **Yes** (HTTPS/Bearer auth throughout).
- Users can request data deletion: `[CONFIRM]` — point this at whatever
  process branzia.app/privacy-policy already describes (account
  deletion via web dashboard or support contact).
- "Is all of this data collection required, or can users opt out?" —
  required; the app has no function without it (it's a business tool
  reading the merchant's own connected Instagram account).

## App access — for Google's reviewer

This is the part that needs a real decision from you, since sign-in is
QR-pairing from an already-authenticated web session (`(auth)/scan.tsx`
→ `branzia.app/instagram` → "Connect Mobile App"), which a reviewer
can't self-serve the way they could with a typed username/password.

Play Console's "App access" section lets you either:
1. **Provide restricted-access instructions** (recommended here) — give
   the reviewer a short written walkthrough + a demo video showing the
   QR pairing and the signed-in app, since they can't generate their
   own pairing code without a live Branzia merchant account.
2. Mark specific screens as **not requiring login** — doesn't apply;
   every screen past Scan requires an authenticated + Instagram-connected
   account.

Draft instructions for the field:

> InstaSale has no username/password login. Sign-in works by scanning a
> short-lived QR code shown on an already-authenticated web session at
> branzia.app/instagram → "Connect Mobile App". Since this code is
> single-use and regenerates every 2 minutes, we've attached a screen
> recording (see below) showing the full sign-in flow and the signed-in
> app (Home, Posts & Reels, Automations, Leads/Orders, Catalog,
> Settings). [CONFIRM: attach that recording, or ask us to set up a
> time-boxed test account + a live pairing code for the reviewer if
> Google requests direct access instead.]

`[CONFIRM]` before submitting: record that walkthrough video (a phone
screen recording of a real sign-in + tour is enough) and attach it here
or upload to Play Console's app-access media field.

---

## Not covered here

Store listing category picker, contact email, and the short/full
description are in `store-assets/listing-copy.md`. Screenshots are
still outstanding — see that file's "Graphics status" table.

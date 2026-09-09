/**
 * API configuration.
 *
 * Both surfaces are built in the Website Laravel repo — see its
 * CLAUDE.md's "Backend APIs" table (Account: QR-scan pairing,
 * product-entitlement, push token; Instagram: connection status, media
 * (Posts & Reels), automations, catalog (products/attributes), leads,
 * orders).
 *
 * IMPORTANT: newly-added routes/migrations may exist only in that repo's
 * working tree at any given time — not yet committed/deployed. Pointing at
 * production `branzia.app` below will 404 on those routes until that's
 * deployed. Point at a local/staging server instead (e.g.
 * `http://<your-lan-ip>:8000/api`, reachable from a physical phone on the
 * same network — `localhost` won't resolve from the device) if you need to
 * test against the working tree.
 */
export const api = {
  accountBaseUrl: 'https://branzia.app/api/account',
  instagramBaseUrl: 'https://branzia.app/api/instagram',
} as const;

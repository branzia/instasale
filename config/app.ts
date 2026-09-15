export const app = {
  brandName: 'Branzia',
  appName: 'InstaSale',
  tagline: 'Turn DMs into Sales',
  /** WhatsApp number (without +) — used for the "Buy Instagram Automation"
   *  contact-us fallback while there's no in-app payment option yet. */
  whatsappNumber: '917358720104',
  storageKeys: {
    token: 'InstaSale_bearer_token',
    account: 'InstaSale_cached_account',
  },
} as const;

export const app = {
  brandName: 'Branzia',
  appName: 'SaleDM',
  tagline: 'Turn DMs into Sales',
  /** WhatsApp number (without +) — used for the "Buy Instagram Automation"
   *  contact-us fallback while there's no in-app payment option yet. */
  whatsappNumber: '917358720104',
  storageKeys: {
    token: 'saledm_bearer_token',
    account: 'saledm_cached_account',
  },
} as const;

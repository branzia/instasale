/**
 * All colors used in inline JS styles across the app.
 *
 * NativeWind className-based colours (e.g. bg-brand-600) are driven by
 * tailwind.config.js, which reads its palette from config/brand.js.
 * Keep brand.primary/gradient here in sync with brand.js if you change
 * the brand colour.
 */

/** SaleDM brand magenta — mirrors the "brand" palette in tailwind.config.js. */
export const brand = {
  primary: '#C13584',
  50: '#FDF1F7',
  100: '#FCE0EE',
  200: '#F8B8DA',
  300: '#F189C0',
  400: '#E056A0',
  500: '#C13584',
  600: '#A32B6E',
  700: '#833AB4',
  800: '#5B2680',
  900: '#3A1854',
  950: '#230F35',
} as const;

/** The real Instagram multi-stop gradient, for use with expo-linear-gradient. */
export const gradient = ['#405DE6', '#833AB4', '#C13584', '#E1306C', '#F77737', '#FCAF45'] as const;
export const gradientShort = ['#833AB4', '#F77737'] as const;

/**
 * Status badge colours — Lead/Order statuses (draft/link_sent/confirmed/
 * paid/expired, mirrors Branzia Store's status palette) plus Automation
 * lifecycle statuses (active/paused), sharing one map so `StatusBadge` can
 * render either from a single source of truth.
 */
export const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#F3F4F6', text: '#374151' },
  link_sent: { bg: '#FEF3C7', text: '#92400E' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF' },
  paid: { bg: '#D1FAE5', text: '#065F46' },
  expired: { bg: '#FEE2E2', text: '#991B1B' },
  active: { bg: '#D1FAE5', text: '#065F46' },
  paused: { bg: '#FEF3C7', text: '#92400E' },
};

/** General-purpose UI palette for inline styles. */
export const ui = {
  /** Primary accent used for active tabs, buttons, links, and icons. */
  accent: brand.primary,
  skeletonBg: '#E5E7EB',
  placeholderText: '#9CA3AF',
  toggleActive: brand.primary,
  toggleInactive: '#D1D5DB',
  modalBackdrop: 'rgba(0,0,0,0.4)',
  borderLight: '#F3F4F6',
  borderLighter: '#F9FAFB',
} as const;

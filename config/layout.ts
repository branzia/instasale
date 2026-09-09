/**
 * Shared with `(tabs)/_layout.tsx`'s own tab bar height calculation — any
 * screen that scrolls needs to know this same number to keep its last
 * element (e.g. a "Save Draft" button) clear of the tab bar, since the tab
 * bar is a fixed footer drawn for every screen in a tab's stack, not just
 * that tab's own index route. Keep both call sites in sync via this one
 * constant/function rather than a copy-pasted formula.
 */
export const TAB_BAR_BASE_HEIGHT = 68;

export function tabBarHeight(insetsBottom: number): number {
  return TAB_BAR_BASE_HEIGHT + Math.max(insetsBottom, 8);
}

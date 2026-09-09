/**
 * SaleDM brand palette — the Instagram gradient (purple → pink → orange),
 * shared between tailwind.config.js and config/colors.ts.
 *
 * `primary` / `palette` give Tailwind's usual 50–950 scale (built around
 * Instagram's magenta, #C13584) for ordinary UI — text, borders, buttons.
 * `gradient` is the actual multi-stop Instagram gradient for hero
 * moments (splash screen, primary CTA, app icon) — NativeWind/Tailwind
 * can't render a gradient by itself, so anywhere that needs the real
 * gradient uses `expo-linear-gradient` with these stops directly rather
 * than a Tailwind class.
 */
module.exports = {
  name: 'SaleDM',
  primary: '#C13584',
  palette: {
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
  },
  // Instagram's real multi-stop brand gradient, left→right.
  gradient: ['#405DE6', '#833AB4', '#C13584', '#E1306C', '#F77737', '#FCAF45'],
  // Two-stop shorthand for simpler UI (buttons, headers) that doesn't want
  // the full 6-stop gradient.
  gradientShort: ['#833AB4', '#F77737'],
};

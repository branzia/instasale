/** @type {import('tailwindcss').Config} */
const brand = require('./config/brand');

module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // InstaSale brand palette (Instagram magenta) — replaces indigo
        // throughout the app. Edit config/brand.js to change it everywhere
        // at once. The real multi-stop gradient lives in config/brand.js's
        // `gradient`/`gradientShort` exports for use with
        // expo-linear-gradient, since Tailwind classes can't express it.
        brand: brand.palette,
      },
    },
  },
  plugins: [],
};

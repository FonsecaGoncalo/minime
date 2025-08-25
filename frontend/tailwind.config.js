/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        brand: '#FF7A1A',        // Primary accent (orange)
        brandAlt: '#7C4DFF',     // Secondary accent (purple)
        edge: '#0B0B0D',         // Primary background
        surface: '#14141C',      // Surface / cards / input
        surfaceAlt: '#1D1D2A',   // Brighter surface for highlights
        ink: '#F2F5F7',          // Neutral text
        muted: '#B6BFCC',        // Secondary text
        borderCosmos: '#262637', // Subtle borders
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        // Porcelain Ember palette
        brand: '#E96A3A',        // Warm coral-orange
        brandAlt: '#F0B429',     // Golden alt
        edge: '#FAF7F3',         // App background
        surface: '#FFFFFF',      // Cards / surfaces
        surfaceAlt: '#F4EFE8',   // Alt surface
        ink: '#22252B',          // Primary text
        muted: '#707680',        // Secondary text
        borderCosmos: '#E8E1D9', // Neutral border
      },
    },
  },
  plugins: [],
}

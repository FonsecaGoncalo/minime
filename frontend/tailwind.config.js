/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        // Studio Light palette — neutral base + single accent (teal)
        brand: '#0EA5E9',        // Teal accent
        brandAlt: '#0369A1',     // Deeper teal
        edge: '#FAFAF8',         // Page background (off‑white)
        surface: '#FFFFFF',      // Cards / surfaces
        surfaceAlt: '#F5F5F3',   // Subtle alt surface
        ink: '#1F2428',          // Primary text (charcoal)
        muted: '#6B7280',        // Secondary text
        borderCosmos: '#E7E9EC', // Neutral border
      },
    },
  },
  plugins: [],
}

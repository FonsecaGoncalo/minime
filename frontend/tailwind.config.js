/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        // Deep Navy (Space) palette
        brand: '#00E0FF',        // Accent 1 (cyan glow)
        brandAlt: '#FF4C29',     // Accent 2 (warm CTA)
        edge: '#0A0F29',         // Primary background
        surface: '#0E1B47',      // Surface / cards / input
        surfaceAlt: '#1A3A8C',   // Brighter surface for highlights
        ink: '#E4E8F0',          // Neutral text
        muted: '#A7B1C5',        // Secondary text
        borderCosmos: '#142042', // Subtle borders
      },
    },
  },
  plugins: [],
}

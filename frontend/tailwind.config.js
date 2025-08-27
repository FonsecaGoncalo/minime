/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        // Minimal Neo‑Brutalist — stark contrast + bold blue accent
        brand: '#2563EB',        // Electric blue
        brandAlt: '#1D4ED8',     // Deeper blue
        edge: '#FFFFFF',         // Pure white background
        surface: '#FFFFFF',      // Cards / surfaces
        surfaceAlt: '#FAFAFA',   // Near‑white alt surface
        ink: '#0A0A0A',          // Near‑black text
        muted: '#6B7280',        // Secondary gray
        borderCosmos: '#0A0A0A', // Visible dark border
      },
    },
  },
  plugins: [],
}

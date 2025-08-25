/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        // User-provided Space palette
        brand: '#006A67',        // teal accent (primary)
        brandAlt: '#FFF4B7',     // pale yellow accent (secondary)
        deepBlue: '#000B58',     // deep space
        midBlue: '#003161',      // mid space
        edge: '#000B58',         // edge/fade background
        surface: '#003161',      // card/input surface
        ink: '#E5E7EB',          // light text on dark
        muted: '#A1A8C3',        // secondary text
        borderCosmos: '#0A2A62', // subtle borders on dark
      },
    },
  },
  plugins: [],
}

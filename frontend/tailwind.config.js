/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        // Antigravity Palette (Stark & Minimal)
        brand: {
          light: '#3C4043',
          DEFAULT: '#121317', // Primary Charcoal
          dark: '#000000',
        },
        accent: {
          DEFAULT: '#E8EAED', // Light Gray for secondary buttons
          hover: '#DADCE0',
        },
        surface: '#FFFFFF',
        surfaceAlt: '#F8F9FA',
        ink: {
          DEFAULT: '#121317', // Charcoal
          light: '#3C4043',   // Medium Gray
          lighter: '#5F6368', // Light Gray
        },
        border: {
          DEFAULT: '#DADCE0',
          light: '#F1F3F4',
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        'pill': '9999px',
      },
      fontFamily: {
        sans: ['"Outfit"', '"Google Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

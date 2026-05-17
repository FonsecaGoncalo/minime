/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        // Outer frame
        frame: '#2a1c12',

        // Left panel (warm)
        paper: '#f5e8d0',
        amberSoft: '#f3c065',
        amber: '#ec8f3e',
        terracotta: '#c0623e',
        ink: {
          DEFAULT: '#1c1815',
          soft: '#52473a',
          muted: '#8b7a64',
        },
        accent: {
          DEFAULT: '#b85a3a',
          soft: '#ec8f3e',
        },

        // Right panel (dusk)
        night: {
          DEFAULT: '#1e3447',
          deep: '#152333',
          soft: '#284359',
        },
        cream: {
          DEFAULT: '#f3e9d3',
          soft: '#cfc3a8',
        },
      },
      borderRadius: {
        pane: '20px',
      },
      fontFamily: {
        sans: ['"Geist"', '"Inter"', 'system-ui', 'sans-serif'],
        serif: ['"Fraunces"', '"Times New Roman"', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}

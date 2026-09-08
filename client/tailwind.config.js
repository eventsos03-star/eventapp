/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#14171f',
        'ink-soft': '#1e2230',
        'ink-line': '#333a4d',
        paper: '#f1ead0',
        'paper-dim': '#e4d9c0',
        amber: {
          DEFAULT: '#e8a33d',
          deep: '#c97c1f',
        },
        teal: '#3c7a6c',
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
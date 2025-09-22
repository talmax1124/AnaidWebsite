/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf7f0',
          100: '#fbeede',
          200: '#f6d5bd',
          300: '#efb692',
          400: '#e69065',
          500: '#d97548',
          600: '#cb5d3d',
          700: '#a94a35',
          800: '#893d31',
          900: '#6f342a',
        },
        secondary: {
          50: '#f8f6f4',
          100: '#f0ebe5',
          200: '#e0d5ca',
          300: '#cdb9a7',
          400: '#b89c82',
          500: '#a08b73',
          600: '#8b7355',
          700: '#725f47',
          800: '#5f4f3d',
          900: '#514336',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
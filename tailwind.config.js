/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'soft-beige': '#f8f5f1',
        'warm-nude': '#e6d8c4',
        'muted-blush': '#f3e6de',
        primary: {
          50: '#f3e6de',
          100: '#e6d8c4',
          200: '#d9cab0',
          300: '#ccbc9c',
          400: '#bfae88',
          500: '#b2a074',
          600: '#000000', // Use black for primary-600 (commonly used for text/buttons)
          700: '#000000',
          800: '#000000',
          900: '#000000',
          DEFAULT: '#f3e6de',
          hover: '#e6d8c4',
          light: '#f8f5f1',
        },
        background: {
          DEFAULT: '#e6d8c4',
          light: '#f8f5f1',
        },
        accent: {
          DEFAULT: '#000000',
          light: '#333333',
        },
        // Override gray scale for better contrast
        gray: {
          50: '#f8f5f1',
          100: '#f8f5f1',
          200: '#d9d9d9',
          300: '#999999',
          400: '#666666',
          500: '#333333',
          600: '#000000',
          700: '#000000',
          800: '#000000',
          900: '#000000',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'Cormorant Garamond', 'serif'],
        body: ['Poppins', 'Montserrat', 'sans-serif'],
        sans: ['Poppins', 'Montserrat', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
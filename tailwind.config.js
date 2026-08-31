/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: 'rgb(var(--color-dark-900) / <alpha-value>)',
          800: 'rgb(var(--color-dark-800) / <alpha-value>)',
          700: 'rgb(var(--color-dark-700) / <alpha-value>)',
          600: 'rgb(var(--color-dark-600) / <alpha-value>)',
          500: 'rgb(var(--color-dark-500) / <alpha-value>)',
          400: 'rgb(var(--color-dark-400) / <alpha-value>)',
          300: 'rgb(var(--color-dark-300) / <alpha-value>)',
          200: 'rgb(var(--color-dark-200) / <alpha-value>)',
          100: 'rgb(var(--color-dark-100) / <alpha-value>)'
        },
        brand: {
          500: 'rgb(var(--color-brand-500) / <alpha-value>)',
          600: 'rgb(var(--color-brand-600) / <alpha-value>)',
          700: 'rgb(var(--color-brand-700) / <alpha-value>)',
          accent: 'rgb(var(--color-brand-accent) / <alpha-value>)'
        }
      }
    },
  },
  plugins: [],
}

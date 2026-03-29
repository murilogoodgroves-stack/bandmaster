/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg-sidebar': '#1e293b',
        'brand-bg-card': '#1e293b',
        'brand-bg-content': '#374151',
        'brand-border': '#475569',
        'brand-accent': '#8b5cf6',
        'brand-accent-dark': '#7c3aed',
        'spotify-green': '#1db954',
      },
    },
  },
  plugins: [],
}
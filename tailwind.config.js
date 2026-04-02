/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Explicit brand color classes
    'bg-brand-accent', 'bg-brand-accent-dark', 'bg-brand-bg-outer', 'bg-brand-bg-sidebar', 'bg-brand-bg-content', 'bg-brand-bg-card', 'bg-brand-border',
    'text-brand-accent', 'text-brand-accent-dark', 'text-brand-bg-outer', 'text-brand-bg-sidebar', 'text-brand-bg-content', 'text-brand-bg-card', 'text-brand-border',
    'border-brand-accent', 'border-brand-accent-dark', 'border-brand-bg-outer', 'border-brand-bg-sidebar', 'border-brand-bg-content', 'border-brand-bg-card', 'border-brand-border',
    'hover:bg-brand-accent', 'hover:bg-brand-accent-dark', 'hover:bg-brand-bg-outer', 'hover:bg-brand-bg-sidebar', 'hover:bg-brand-bg-content', 'hover:bg-brand-bg-card', 'hover:bg-brand-border',
    'hover:text-brand-accent', 'hover:text-brand-accent-dark', 'hover:text-brand-bg-outer', 'hover:text-brand-bg-sidebar', 'hover:text-brand-bg-content', 'hover:text-brand-bg-card', 'hover:text-brand-border',
    'hover:border-brand-accent', 'hover:border-brand-accent-dark', 'hover:border-brand-bg-outer', 'hover:border-brand-bg-sidebar', 'hover:border-brand-bg-content', 'hover:border-brand-bg-card', 'hover:border-brand-border',
    'focus:ring-brand-accent', 'focus:ring-brand-accent-dark', 'focus:ring-brand-bg-outer', 'focus:ring-brand-bg-sidebar', 'focus:ring-brand-bg-content', 'focus:ring-brand-bg-card', 'focus:ring-brand-border',
    // With opacity modifiers
    'bg-brand-accent/10', 'bg-brand-accent/20', 'bg-brand-accent/50', 'bg-brand-accent-dark/10', 'bg-brand-accent-dark/20', 'bg-brand-accent-dark/50',
    'text-brand-accent/10', 'text-brand-accent/20', 'text-brand-accent/50', 'text-brand-accent-dark/10', 'text-brand-accent-dark/20', 'text-brand-accent-dark/50',
    'border-brand-accent/10', 'border-brand-accent/20', 'border-brand-accent/50', 'border-brand-accent-dark/10', 'border-brand-accent-dark/20', 'border-brand-accent-dark/50',
    'hover:bg-brand-accent/10', 'hover:bg-brand-accent/20', 'hover:bg-brand-accent/50', 'hover:bg-brand-accent-dark/10', 'hover:bg-brand-accent-dark/20', 'hover:bg-brand-accent-dark/50',
    'hover:border-brand-accent/10', 'hover:border-brand-accent/20', 'hover:border-brand-accent/50', 'hover:border-brand-accent-dark/10', 'hover:border-brand-accent-dark/20', 'hover:border-brand-accent-dark/50',
    'ring-brand-accent/50',
  ],
  theme: {
    extend: {
      colors: {
        'brand-accent': '#E11D48',
        'brand-accent-dark': '#BE123C',
        'brand-bg-outer': '#111111',
        'brand-bg-sidebar': '#181818',
        'brand-bg-content': '#1F1F1F',
        'brand-bg-card': '#282828',
        'brand-border': '#383838',
        'spotify-green': '#1db954',
      },
    },
  },
  plugins: [],
}
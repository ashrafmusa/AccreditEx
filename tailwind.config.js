/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-primary': '#4f46e5',
        'brand-surface': '#ffffff',
        'brand-background': '#f8fafc',
        'brand-border': '#e2e8f0',
        'brand-text-primary': '#0f172a',
        'brand-text-secondary': '#64748b',
        'brand-success': '#22c55e',
        'brand-warning': '#f97316',
        'dark-brand-surface': '#1e293b',
        'dark-brand-background': '#020617',
        'dark-brand-border': '#334155',
        'dark-brand-text-primary': '#e2e8f0',
        'dark-brand-text-secondary': '#94a3b8',
      }
    }
  },
  plugins: [],
}
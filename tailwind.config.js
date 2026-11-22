/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: 'var(--bg)',
        'bg-soft': 'var(--bg-soft)',
        surface: 'var(--surface)',
        'surface-solid': 'var(--surface-solid)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        'btn-text': 'var(--btn-text)',
        gold: '#f59e0b',
        silver: '#38bdf8',
        bronze: '#fb7185',
        mint: '#34d399',
        rose: '#f43f5e',
        sky: '#38bdf8',
      },
    },
  },
  plugins: [],
};

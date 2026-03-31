/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy-deep': '#020617',
        'slate-glass': 'rgba(15, 23, 42, 0.7)',
        'neon-emerald': '#10b981',
        'arctic-violet': '#8b5cf6',
        'status-idle': '#10b981',
        'status-busy': '#ef4444',
        'slate-450': '#94a3b8',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.15)' },
        },
      },
    },
  },
  plugins: [],
}

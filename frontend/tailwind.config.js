/** @type {import('tailwindcss').Config} */
export default {
  // Enable class-based dark mode toggling
  darkMode: 'class',

  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      // ── Brand Colors ────────────────────────────────────────────────────
      colors: {
        // Light Mode — RGBY accent palette
        'brand-red':    '#EF4444',   // Tailwind red-500
        'brand-green':  '#22C55E',   // Tailwind green-500
        'brand-blue':   '#3B82F6',   // Tailwind blue-500
        'brand-yellow': '#EAB308',   // Tailwind yellow-500

        // Dark Mode — Purple accent palette
        'brand-purple': {
          DEFAULT: '#A855F7',        // purple-500
          light:   '#C084FC',        // purple-400
          dark:    '#7C3AED',        // violet-600
          glow:    '#6D28D9',        // violet-700 (for box-shadow glows)
        },

        // Glassmorphism surface tokens
        glass: {
          light: 'rgba(255, 255, 255, 0.6)',
          dark:  'rgba(15, 23, 42, 0.6)',    // slate-900 at 60%
        },
      },

      // ── Gradients ────────────────────────────────────────────────────────
      backgroundImage: {
        // Light Mode hero gradient
        'hero-light': 'linear-gradient(135deg, #FFFFFF 0%, #F0F9FF 50%, #FAF5FF 100%)',
        // Dark Mode hero gradient
        'hero-dark':  'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)',
        // Purple glow gradient for dark mode accents
        'purple-glow': 'radial-gradient(ellipse at center, rgba(168,85,247,0.35) 0%, transparent 70%)',
        // RGBY gradient for light mode mic button
        'rgby-ring': 'conic-gradient(#EF4444, #EAB308, #22C55E, #3B82F6, #EF4444)',
      },

      // ── Animations ───────────────────────────────────────────────────────
      keyframes: {
        // Mic recording pulse — light mode (RGBY)
        'pulse-rgby': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.6)' },
          '25%':       { boxShadow: '0 0 0 12px rgba(234,179,8,0.4)' },
          '50%':       { boxShadow: '0 0 0 20px rgba(34,197,94,0.3)' },
          '75%':       { boxShadow: '0 0 0 12px rgba(59,130,246,0.4)' },
        },
        // Mic recording pulse — dark mode (Purple)
        'pulse-purple': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(168,85,247,0.7)' },
          '50%':       { boxShadow: '0 0 0 22px rgba(168,85,247,0)' },
        },
        // Subtle fade-in-up for page elements
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        // Typing dots for "Bot is thinking..."
        'bounce-dot': {
          '0%, 80%, 100%': { transform: 'scale(0.8)', opacity: '0.5' },
          '40%':           { transform: 'scale(1.2)', opacity: '1' },
        },
        // Waveform bar for active recording visual
        'wave-bar': {
          '0%, 100%': { height: '4px' },
          '50%':      { height: '20px' },
        },
      },
      animation: {
        'pulse-rgby':   'pulse-rgby 1.5s ease-in-out infinite',
        'pulse-purple': 'pulse-purple 1.5s ease-in-out infinite',
        'fade-up':      'fade-up 0.5s ease-out forwards',
        'bounce-dot-1': 'bounce-dot 1.2s ease-in-out 0s infinite',
        'bounce-dot-2': 'bounce-dot 1.2s ease-in-out 0.2s infinite',
        'bounce-dot-3': 'bounce-dot 1.2s ease-in-out 0.4s infinite',
        'wave-bar-1':   'wave-bar 0.8s ease-in-out 0s infinite',
        'wave-bar-2':   'wave-bar 0.8s ease-in-out 0.15s infinite',
        'wave-bar-3':   'wave-bar 0.8s ease-in-out 0.30s infinite',
        'wave-bar-4':   'wave-bar 0.8s ease-in-out 0.45s infinite',
        'wave-bar-5':   'wave-bar 0.8s ease-in-out 0.60s infinite',
      },

      // ── Typography ───────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },

      // ── Blur / Backdrop ──────────────────────────────────────────────────
      backdropBlur: {
        xs: '2px',
      },
    },
  },

  plugins: [],
}

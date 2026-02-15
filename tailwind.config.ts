import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Black & White theme
        primary: {
          black: '#000000',
          white: '#FFFFFF',
        },
        // Feedback colors
        success: {
          DEFAULT: '#22C55E',
          light: '#86EFAC',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#FCA5A5',
        },
        // Grays for disabled states and borders
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        'header': '1.5rem',    // 24px
        'body': '1rem',        // 16px
        'small': '0.875rem',   // 14px
      },
      borderRadius: {
        'card': '12px',
      },
      spacing: {
        'nav': '64px',         // Bottom nav height
        'button': '44px',      // Minimum touch target
      },
      transitionDuration: {
        'default': '200ms',
      },
      transitionTimingFunction: {
        'default': 'cubic-bezier(0.4, 0, 0.2, 1)', // ease-in-out
      },
    },
  },
  plugins: [],
} satisfies Config

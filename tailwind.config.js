/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0E7490', // Teal for primary actions
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
        },
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
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        // Base design system 4pt grid
        '0.5': '2px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '28': '112px',
        '32': '128px',
      },
      fontSize: {
        // Base modular scale (8:9 ratio, 14pt base)
        'xs': ['12px', { lineHeight: '1.45' }],
        'sm': ['14px', { lineHeight: '1.45' }],
        'base': ['16px', { lineHeight: '1.45' }],
        'lg': ['18px', { lineHeight: '1.45' }],
        'xl': ['20px', { lineHeight: '1.45' }],
        '2xl': ['22px', { lineHeight: '1.45' }],
        '3xl': ['25px', { lineHeight: '1.45' }],
        '4xl': ['28px', { lineHeight: '1.45' }],
        '5xl': ['32px', { lineHeight: '1.45' }],
        'display': ['40px', { lineHeight: '1.2' }],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

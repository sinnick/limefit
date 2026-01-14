/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary - Lime
        lime: {
          DEFAULT: '#C4F135',
          dark: '#9BC12A',
          light: '#D4F855',
          50: '#F7FDE6',
          100: '#EFFBCC',
          200: '#DFF899',
          300: '#D4F855',
          400: '#C4F135',
          500: '#9BC12A',
          600: '#7A9A21',
          700: '#5A7318',
          800: '#3A4C0F',
          900: '#1A2506',
        },
        // Background
        background: '#101010',
        surface: '#1a1a2e',
        'surface-light': '#252536',
        card: '#1e1e30',
        // Text
        'text-primary': '#FFFFFF',
        'text-secondary': '#9CA3AF',
        'text-muted': '#6B7280',
        // Status
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
        // Misc
        border: '#2D2D3D',
        overlay: 'rgba(0, 0, 0, 0.7)',
      },
      fontFamily: {
        sans: ['Work-Sans', 'sans-serif'],
        'work-sans': ['Work-Sans'],
        'work-sans-light': ['Work-Sans-Light'],
        'work-sans-medium': ['Work-Sans-Medium'],
        'work-sans-semibold': ['Work-Sans-SemiBold'],
        'work-sans-bold': ['Work-Sans-Bold'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
        '5xl': ['48px', { lineHeight: '48px' }],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        'xxl': '48px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'xl': '24px',
        'xxl': '32px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        'md': '0 2px 4px 0 rgba(0, 0, 0, 0.25)',
        'lg': '0 4px 8px 0 rgba(0, 0, 0, 0.3)',
        'lime': '0 0 12px rgba(196, 241, 53, 0.3)',
      },
    },
  },
  plugins: [],
};

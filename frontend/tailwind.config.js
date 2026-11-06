/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0f7f3',
          100: '#dceee3',
          200: '#bbdecb',
          300: '#8ec5ac',
          400: '#5da78a',
          500: '#3c8c6f',
          DEFAULT: '#174D3A', // Primary Brand Forest Green
          700: '#133f30',
          800: '#0f3126',
          900: '#0c261e',
        },
        ivory: {
          50: '#fbfbf9',
          DEFAULT: '#F7F5EF', // Warm Ivory
          100: '#efece1',
          200: '#e3dcbe',
          300: '#d5ca9c',
        },
        terracotta: {
          50: '#fdf5f2',
          100: '#fbe7e1',
          200: '#f8d2c6',
          300: '#f1b3a1',
          400: '#e68f76',
          DEFAULT: '#D87955', // Terracotta Accent
          600: '#c05c36',
          700: '#a14728',
          800: '#833a23',
          900: '#6c3220',
        },
        charcoal: {
          50: '#f6f7f6',
          100: '#e2e5e3',
          200: '#c4cbc6',
          300: '#9ea9a2',
          400: '#75837a',
          500: '#5b6860',
          600: '#46514b',
          700: '#373f3a',
          DEFAULT: '#202822', // Charcoal
          900: '#141a15',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(23, 77, 58, 0.08)',
        'elevated': '0 20px 40px -15px rgba(23, 77, 58, 0.12)',
        'card': '0 8px 30px rgba(32, 40, 34, 0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

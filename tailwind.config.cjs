/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ── Amber Meridian — Primary (Terracotta) ── */
        health: {
          blue: '#ffb4a1',     /* primary – terracotta glow */
          dark: '#891f00',     /* on-primary-fixed-variant */
          light: '#ffdbd2',    /* primary-fixed */
        },
        /* ── Amber Meridian — Secondary (Gold) ── */
        calm: {
          green: '#f4be55',    /* secondary – gold accent */
          dark: '#5e4200',     /* on-secondary-fixed-variant */
          light: '#ffdea7',    /* secondary-fixed */
        },
        /* ── Amber Meridian — Tertiary (Cream) ── */
        tertiary: {
          DEFAULT: '#cec5b9',
          dark: '#4b463d',
          light: '#eae1d4',
        },
        /* ── Amber Meridian — Error ── */
        error: {
          DEFAULT: '#ffb4ab',
          dark: '#690005',
          container: '#93000a',
        },
        /* ── Override absolute colors ── */
        black: '#261614',    /* Map all pure blacks to Deep Brown per spec */
        white: '#F2E9DC',    /* Map all pure whites to Cream per spec */
        
        /* ── Amber Meridian — Surface scale (warm browns) ── */
        gray: {
          50:  '#fffbff',    /* on-secondary-container — near white */
          100: '#ffe7e2',    /* on-primary-container */
          200: '#ffdbd2',    /* primary-fixed */
          300: '#ffdad4',    /* on-surface — cream text */
          400: '#e0bfb7',    /* on-surface-variant */
          500: '#a88a83',    /* outline */
          600: '#59413b',    /* outline-variant */
          700: '#472f2a',    /* surface-container-highest / surface-variant */
          800: '#472f2a',    /* surface-container-high -> mapped to surface variant for borders/hovers */
          900: '#3D2622',    /* surface-container -> mapped to Umber for cards */
          950: '#261614',    /* surface / background -> mapped to Deep Brown */
        },
        /* ── Semantic surface tokens ── */
        surface: {
          DEFAULT:   '#210e0b',
          dim:       '#210e0b',
          bright:    '#4c332f',
          lowest:    '#1b0906',
          low:       '#2b1613',
          container: '#2f1a16',
          high:      '#3b2420',
          highest:   '#472f2a',
        },
        /* ── Amber Meridian — Card & accent colors ── */
        card: {
          DEFAULT: '#3D2622',    /* umber card background from design spec */
          header:  '#3D2622',
        },
        'primary-container': '#bd401e',
        'secondary-container': '#986d00',
        'inverse-surface': '#ffdad4',
        'inverse-primary': '#ac3412',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-lg':     ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md':     ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-md':    ['14px', { lineHeight: '20px', letterSpacing: '0.05em', fontWeight: '500' }],
        'label-sm':    ['12px', { lineHeight: '16px', letterSpacing: '0.08em', fontWeight: '500' }],
      },
      spacing: {
        'grid-xs':     '4px',
        'grid-sm':     '12px',
        'grid-base':   '8px',
        'grid-md':     '24px',
        'grid-lg':     '40px',
        'grid-xl':     '64px',
        'gutter':      '24px',
        'margin-mobile': '16px',
        'margin-desktop': '48px',
      },
      borderRadius: {
        'sm':  '0.25rem',
        DEFAULT: '0.5rem',
        'md':  '0.75rem',
        'lg':  '1rem',
        'xl':  '1.5rem',
        '2xl': '1.5rem',
        '3xl': '1.5rem',
        'full': '9999px',
      },
      boxShadow: {
        'warm':     '0 8px 24px rgba(38, 22, 20, 0.5)',
        'warm-sm':  '0 2px 8px rgba(38, 22, 20, 0.3)',
        'warm-lg':  '0 12px 40px rgba(38, 22, 20, 0.6)',
        'warm-xl':  '0 20px 60px rgba(38, 22, 20, 0.7)',
        'glow-primary': '0 0 20px rgba(255, 180, 161, 0.3)',
        'glow-gold':    '0 0 20px rgba(244, 190, 85, 0.3)',
        'glow-error':   '0 0 30px rgba(255, 75, 75, 0.4)',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
// Choosepure design tokens. Merge `theme.extend` into your project's tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand greens
        green: {
          25:  '#F4F8F5',
          50:  '#EDF3EE',
          100: '#D4E3D8',
          400: '#5DA47B',
          500: '#3D8862',
          700: '#2D7A52',
          800: '#226342',
          900: '#1B4332',
        },
        // Neutral surface
        cream: {
          50: '#F5F7F4',
          DEFAULT: '#F5F7F4',
        },
        ink: {
          DEFAULT: '#1A201A',
          muted:   '#6B7268',
          dim:     '#9B9F97',
        },
        line: {
          DEFAULT: '#ECEAE4',
          soft:    '#F4F2EC',
        },
        // Nutri-Score scale
        nutri: {
          a: '#1E8449',
          b: '#7CB342',
          c: '#F4C430',
          d: '#E89B3C',
          e: '#D14E36',
        },
        // Semantic safety scores
        score: {
          good:    '#2D6B4F',
          'good-bg': '#D9E8DD',
          mid:     '#8B6F3D',
          'mid-bg':  '#F0E5D5',
          bad:     '#A8482E',
          'bad-bg':  '#F4DDD4',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Mobile type scale
        '2xs': ['10px', { lineHeight: '1.4' }],
        xs:    ['11px', { lineHeight: '1.45' }],
        sm:    ['13px', { lineHeight: '1.5' }],
        base:  ['14px', { lineHeight: '1.55' }],
        md:    ['15px', { lineHeight: '1.5' }],
        lg:    ['17px', { lineHeight: '1.4' }],
        xl:    ['19px', { lineHeight: '1.3' }],
        '2xl': ['22px', { lineHeight: '1.25' }],
        '3xl': ['26px', { lineHeight: '1.2',  letterSpacing: '-0.5px' }],
        '4xl': ['32px', { lineHeight: '1.1',  letterSpacing: '-1px'   }],
      },
      borderRadius: {
        sm:  '8px',
        md:  '10px',
        lg:  '14px',
        xl:  '18px',
        '2xl': '24px',
      },
      boxShadow: {
        card:    '0 1px 3px rgba(0,0,0,0.04)',
        elev:    '0 4px 12px rgba(34,99,66,0.18)',
        pop:     '0 8px 24px rgba(0,0,0,0.12)',
      },
      spacing: {
        // Common safe-area paddings
        'safe-top':    '44px',
        'safe-bottom': '34px',
      },
      maxWidth: {
        phone: '390px',
      },
      keyframes: {
        scanline: {
          '0%, 100%': { top: '4px' },
          '50%':       { top: 'calc(100% - 8px)' },
        },
        'fade-up': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to:   { opacity: 1, transform: 'translateY(0)'   },
        },
      },
      animation: {
        scanline:  'scanline 2s ease-in-out infinite',
        'fade-up': 'fade-up 0.25s ease-out',
      },
    },
  },
  plugins: [],
}

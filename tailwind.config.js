/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // GT Group Brand Palette — exact match to CSS variables
        gold:    '#EFB748',
        'gold-light': '#F1DA7C',
        'gold-dim':   '#E6BC32',
        'gold-dark':  '#C9930A',
        navy:    '#080B14',
        charcoal: '#3F434C',

        // Surface system
        'surface-1': '#161918',
        'surface-2': '#1E2220',
        'surface-3': '#252928',
        'card':      '#1A1E1C',
        'bg':        '#0F1110',

        // Text
        'text':      '#F0EDE6',
        'text-muted': '#9A9EA8',
        'text-dim':   '#5A5E68',

        // Semantic
        success: '#10B981',
        warning: '#F59E0B',
        danger:  '#EF4444',
        info:    '#3B82F6',
        purple:  '#8B5CF6',

        // Shorthand aliases used widely in pages
        green: {
          500: '#10B981',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm:  '10px',
        DEFAULT: '16px',
        lg:  '24px',
        xl:  '32px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        gold: '0 0 32px rgba(201,162,39,0.15)',
        glow: '0 0 48px rgba(201,162,39,0.08)',
        sm:   '0 2px 8px rgba(0,0,0,0.2)',
        md:   '0 8px 24px rgba(0,0,0,0.35)',
        lg:   '0 20px 48px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(239,183,72,0.06) 0%, rgba(255,255,255,0.03) 100%)',
      },
      animation: {
        'fade-in':  'fadeIn 0.3s ease',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
        'spin-slow': 'spin 2s linear infinite',
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        DEFAULT: '16px',
        md: '20px',
        lg: '24px',
        xl: '32px',
      },
    },
  },
  plugins: [],
};

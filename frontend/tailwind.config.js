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
        // Primary Palette
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6d28d9',
          900: '#5b21b6',
          950: '#3b0764',
        },
        // Accent Colors
        accent: {
          pink: '#ec4899',
          cyan: '#06b6d4',
          emerald: '#10b981',
          amber: '#f59e0b',
        },
        // Background Colors
        dark: {
          50: '#1a0a2e',
          100: '#150825',
          200: '#120726',
          300: '#0f051e',
          400: '#0a0118',
          500: '#050012',
          600: '#030014',
          700: '#020010',
          800: '#01000c',
          900: '#000008',
        },
        // Polygon Brand
        polygon: {
          purple: '#8247E5',
          light: '#A98FF8',
          dark: '#5E2EBE',
        },
        // Glass Colors
        glass: {
          white: 'rgba(255, 255, 255, 0.03)',
          dark: 'rgba(0, 0, 0, 0.3)',
          purple: 'rgba(168, 85, 247, 0.1)',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        // Gradients
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-mesh': 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #06b6d4 100%)',
        'gradient-dark': 'radial-gradient(ellipse at top, #1a0a2e 0%, #030014 50%, #000008 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(15, 7, 36, 0.7) 0%, rgba(5, 0, 20, 0.5) 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
        // Glow Effects
        'glow-purple': 'radial-gradient(circle at center, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
        'glow-pink': 'radial-gradient(circle at center, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
        'glow-cyan': 'radial-gradient(circle at center, rgba(6, 182, 212, 0.3) 0%, transparent 70%)',
        // Patterns
        'grid-pattern': 'linear-gradient(to right, rgba(168, 85, 247, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(168, 85, 247, 0.03) 1px, transparent 1px)',
        'dots-pattern': 'radial-gradient(rgba(168, 85, 247, 0.15) 1px, transparent 1px)',
      },
      boxShadow: {
        'glow': '0 0 40px rgba(168, 85, 247, 0.15)',
        'glow-lg': '0 0 60px rgba(168, 85, 247, 0.25), 0 0 100px rgba(236, 72, 153, 0.15)',
        'glow-purple': '0 0 30px rgba(168, 85, 247, 0.4)',
        'glow-pink': '0 0 30px rgba(236, 72, 153, 0.4)',
        'glow-cyan': '0 0 30px rgba(6, 182, 212, 0.4)',
        'inner-glow': 'inset 0 0 20px rgba(168, 85, 247, 0.1)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(168, 85, 247, 0.1)',
        'card-hover': '0 16px 48px rgba(0, 0, 0, 0.5), 0 0 60px rgba(168, 85, 247, 0.2)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'shimmer': 'shimmer 2s infinite',
        'gradient': 'gradient 3s ease infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
            borderColor: 'rgba(168, 85, 247, 0.3)',
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(168, 85, 247, 0.5)',
            borderColor: 'rgba(168, 85, 247, 0.5)',
          },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'elastic': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      backdropBlur: {
        xs: '2px',
        '3xl': '64px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      screens: {
        'xs': '475px',
        '3xl': '1920px',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [],
}

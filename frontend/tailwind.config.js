/** @type {import('tailwindcss').Config} */

// Warm "paper & violet ink" greys. Overriding slate/gray re-skins every page at once
// while keeping the existing class names in the codebase.
const ink = {
  50: '#F8F6F1',
  100: '#F1EEE7',
  200: '#E5E0D5',
  300: '#CEC8BA',
  400: '#9A93A9',
  500: '#6F6882',
  600: '#524B65',
  700: '#3B3552',
  800: '#271F3E',
  900: '#161128',
  950: '#0E0A1C',
}

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dynamix Services graphic charter, sampled from dynlogo.jpg
        primary: {
          DEFAULT: '#3B2176',
          50: '#F5F0FB',
          100: '#E8DDF5',
          200: '#D0BBE8',
          300: '#B08FD6',
          400: '#7A52B0',
          500: '#3B2176',
          600: '#2F1A5E',
          700: '#241448',
          800: '#190E32',
          900: '#0F081E',
        },
        brand: {
          violet: '#3B2176',
          blue: '#4A6AAD',
          green: '#22B135',
          red: '#D10424',
          yellow: '#F1CA15',
          primary: '#3B2176',
          surface: '#F6F2FA',
          border: '#E5E0D5',
        },
        accent: {
          DEFAULT: '#4A6AAD',
          purple: '#3B2176',
          green: '#22B135',
          red: '#D10424',
          yellow: '#F1CA15',
        },
        paper: {
          DEFAULT: '#F5F2EB',
          deep: '#ECE8DE',
        },
        ink: ink,
        slate: ink,
        gray: ink,
        neutral: {
          white: '#FFFFFF',
          light: '#F5F2EB',
          medium: '#E5E0D5',
          dark: '#6F6882',
          charcoal: '#161128',
          black: '#000000',
        },
        status: {
          success: '#22B135',
          warning: '#C89600',
          error: '#D10424',
          info: '#4A6AAD',
        },
      },
      fontFamily: {
        sans: ['"Schibsted Grotesk"', '"IBM Plex Sans Arabic"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        display: ['"Familjen Grotesk"', '"IBM Plex Sans Arabic"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', '"IBM Plex Sans Arabic"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      fontWeight: {
        // Lighter, calmer weights: the heavy "font-black" look is a big part of the generic feel.
        semibold: '600',
        bold: '600',
        extrabold: '700',
        black: '700',
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.625rem',
        '2xl': '0.75rem',
        '3xl': '1rem',
      },
      boxShadow: {
        sm: '0 1px 0 rgba(22, 17, 40, 0.04)',
        DEFAULT: '0 1px 2px rgba(22, 17, 40, 0.06)',
        md: '0 1px 2px rgba(22, 17, 40, 0.05), 0 4px 12px -4px rgba(22, 17, 40, 0.10)',
        lg: '0 1px 2px rgba(22, 17, 40, 0.05), 0 10px 24px -10px rgba(22, 17, 40, 0.16)',
        xl: '0 2px 4px rgba(22, 17, 40, 0.05), 0 18px 36px -14px rgba(22, 17, 40, 0.22)',
        '2xl': '0 4px 8px rgba(22, 17, 40, 0.06), 0 28px 56px -18px rgba(22, 17, 40, 0.30)',
        soft: '0 1px 0 rgba(22, 17, 40, 0.04), 0 1px 2px rgba(22, 17, 40, 0.04)',
        medium: '0 1px 2px rgba(22, 17, 40, 0.05), 0 4px 12px -4px rgba(22, 17, 40, 0.10)',
        large: '0 2px 4px rgba(22, 17, 40, 0.05), 0 18px 36px -14px rgba(22, 17, 40, 0.22)',
        glow: '0 0 0 4px rgba(59, 33, 118, 0.12)',
        'glow-purple': '0 0 0 4px rgba(59, 33, 118, 0.12)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #3B2176 0%, #2F1A5E 100%)',
        'gradient-brand': 'linear-gradient(135deg, #3B2176 0%, #2F1A5E 100%)',
        'gradient-purple': 'linear-gradient(135deg, #3B2176 0%, #2F1A5E 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #D10424 0%, #F1CA15 100%)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '24px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shake': 'shake 0.45s cubic-bezier(.36,.07,.19,.97) both',
        'cube-hop': 'cubeHop 1.1s ease-in-out infinite',
        'rise': 'rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'cube-pulse': 'cubePulse 3.2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '10%, 90%': { transform: 'translateX(-1px)' },
          '20%, 80%': { transform: 'translateX(2px)' },
          '30%, 50%, 70%': { transform: 'translateX(-4px)' },
          '40%, 60%': { transform: 'translateX(4px)' },
        },
        cubeHop: {
          '0%, 60%, 100%': { transform: 'translateY(0) scale(1)', opacity: '0.55' },
          '30%': { transform: 'translateY(-10px) scale(1.08)', opacity: '1' },
        },
        cubePulse: {
          '0%, 100%': { opacity: '0.35', transform: 'scale(0.82)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        rise: {
          '0%': { transform: 'translateY(14px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

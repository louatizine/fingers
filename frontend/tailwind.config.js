/** @type {import('tailwindcss').Config} */
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
          surface: '#F5F0FB',
          border: '#E4D8F2',
        },
        accent: {
          DEFAULT: '#4A6AAD',
          purple: '#3B2176',
          green: '#22B135',
          red: '#D10424',
          yellow: '#F1CA15',
        },
        neutral: {
          white: '#FFFFFF',
          light: '#F8F9FA',
          medium: '#E9ECEF',
          dark: '#6C757D',
          charcoal: '#212529',
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
        sans: ['"Inter"', '"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'large': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glow': '0 0 24px rgba(59, 33, 118, 0.28)',
        'glow-purple': '0 0 24px rgba(59, 33, 118, 0.35)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #3B2176 0%, #2F1A5E 100%)',
        'gradient-brand': 'linear-gradient(135deg, #3B2176 0%, #2F1A5E 100%)',
        'gradient-purple': 'linear-gradient(135deg, #3B2176 0%, #2F1A5E 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #D10424 0%, #F1CA15 100%)',
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
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
      },
    },
  },
  plugins: [],
}
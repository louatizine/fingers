/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Modern BC-inspired palette with vibrancy
        primary: {
          DEFAULT: '#0078D4',
          50: '#E5F3FF',
          100: '#CCE7FF',
          200: '#99CFFF',
          300: '#66B7FF',
          400: '#339FFF',
          500: '#0078D4',
          600: '#0060AA',
          700: '#004880',
          800: '#003055',
          900: '#00182B',
        },
        accent: {
          DEFAULT: '#00BCF2',
          purple: '#8B5CF6',
          pink: '#EC4899',
          orange: '#F97316',
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
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#0078D4',
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
        'glow': '0 0 24px rgba(0, 120, 212, 0.2)',
        'glow-purple': '0 0 24px rgba(139, 92, 246, 0.3)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0078D4 0%, #00BCF2 100%)',
        'gradient-purple': 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #F97316 0%, #EC4899 100%)',
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
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
        'deep-space': '#0a0a12',
        'midnight': '#12121f',
        'cosmic-purple': '#1a1a2e',
        'nebula': '#2d2d4a',
        'stardust': '#c9b8ff',
        'gold': {
          DEFAULT: '#d4af37',
          light: '#f4e4a6',
        },
        'cream': '#faf8f5',
        'text-muted': '#8b8ba3',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      spacing: {
        '4xl': '6rem',
        '5xl': '8rem',
        '6xl': '10rem',
      },
      boxShadow: {
        'gold': '0 4px 20px rgba(212, 175, 55, 0.3)',
        'gold-lg': '0 20px 40px rgba(212, 175, 55, 0.4)',
      },
      animation: {
        'fade-up': 'fadeUp 0.8s ease forwards',
        'fade-in': 'fadeIn 0.6s ease forwards',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          'from': { opacity: '0', transform: 'translateY(30px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #d4af37, #f4e4a6)',
        'gradient-cosmic': 'linear-gradient(135deg, #1a1a2e, #2d2d4a)',
        'gradient-deep-space': 'linear-gradient(to bottom, #0a0a12, #12121f)',
      },
    },
  },
  plugins: [],
}

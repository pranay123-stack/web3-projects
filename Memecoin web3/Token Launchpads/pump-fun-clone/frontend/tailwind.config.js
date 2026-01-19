/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/providers/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary neon colors
        neon: {
          green: '#00ff88',
          'green-dark': '#00cc6a',
          'green-glow': 'rgba(0, 255, 136, 0.5)',
          purple: '#bf00ff',
          'purple-dark': '#9900cc',
          'purple-glow': 'rgba(191, 0, 255, 0.5)',
          pink: '#ff00aa',
          'pink-glow': 'rgba(255, 0, 170, 0.5)',
          cyan: '#00ffff',
          'cyan-glow': 'rgba(0, 255, 255, 0.5)',
        },
        // Dark backgrounds
        dark: {
          950: '#0a0a0f',
          900: '#0f0f18',
          850: '#141420',
          800: '#1a1a2e',
          700: '#252540',
          600: '#2d2d4a',
          500: '#3d3d5c',
        },
        // Accent colors
        accent: {
          success: '#00ff88',
          warning: '#ffaa00',
          error: '#ff3366',
          info: '#00aaff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-neon': 'linear-gradient(135deg, #00ff88 0%, #bf00ff 50%, #00ffff 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%)',
        'grid-pattern': 'linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px)',
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(0, 255, 136, 0.5), 0 0 40px rgba(0, 255, 136, 0.3), 0 0 60px rgba(0, 255, 136, 0.1)',
        'neon-purple': '0 0 20px rgba(191, 0, 255, 0.5), 0 0 40px rgba(191, 0, 255, 0.3), 0 0 60px rgba(191, 0, 255, 0.1)',
        'neon-cyan': '0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.3), 0 0 60px rgba(0, 255, 255, 0.1)',
        'neon-pink': '0 0 20px rgba(255, 0, 170, 0.5), 0 0 40px rgba(255, 0, 170, 0.3), 0 0 60px rgba(255, 0, 170, 0.1)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 255, 136, 0.1)',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'gradient': 'gradient 8s ease infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        'glow': {
          '0%': { boxShadow: '0 0 20px rgba(0, 255, 136, 0.5)' },
          '100%': { boxShadow: '0 0 30px rgba(0, 255, 136, 0.8), 0 0 60px rgba(0, 255, 136, 0.4)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'gradient': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
}

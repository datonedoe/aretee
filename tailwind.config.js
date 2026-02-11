/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#0D0D1A',
        surface: '#1A1A2E',
        'surface-light': '#252542',
        primary: '#6C3CE1',
        accent: '#00E5FF',
        'text-primary': '#E8E8F0',
        'text-secondary': '#9A9AB0',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#F43F5E',
        border: '#2A2A4A',
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
      },
    },
  },
  plugins: [],
}

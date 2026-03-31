/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['15px', { lineHeight: '24px' }],
        lg: ['17px', { lineHeight: '22px' }],
      },
      fontFamily: {
        sans: ['Inter'],
        mono: ['JetBrains Mono'],
      },
      colors: {
        surface: {
          sunken: 'rgb(38, 35, 33)',
          base: 'rgb(46, 42, 40)',
          raised: 'rgb(54, 50, 48)',
          overlay: 'rgb(62, 59, 56)',
        },
        accent: {
          DEFAULT: 'rgb(196, 108, 88)',
          hover: 'rgb(210, 122, 102)',
          muted: 'rgba(196, 108, 88, 0.15)',
          fg: 'rgb(46, 42, 40)',
        },
        text: {
          primary: 'rgb(230, 222, 216)',
          secondary: 'rgb(191, 186, 182)',
          muted: 'rgb(148, 144, 141)',
        },
        destructive: 'rgb(210, 112, 88)',
        success: 'rgb(82, 175, 108)',
        warning: 'rgb(192, 160, 72)',
        info: 'rgb(100, 150, 210)',
        border: {
          subtle: 'rgba(255, 255, 255, 0.07)',
          interactive: 'rgba(255, 255, 255, 0.34)',
        },
      },
    },
  },
  plugins: [],
};

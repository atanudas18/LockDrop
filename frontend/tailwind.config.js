/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff', 100: '#dbe7fe', 200: '#bfd3fe', 300: '#93b5fd',
          400: '#608cfa', 500: '#3b66f5', 600: '#2547ea', 700: '#1f36d6',
          800: '#202eae', 900: '#202b89',
        },
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(-30px) translateX(15px)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        floatSlow: 'floatSlow 10s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

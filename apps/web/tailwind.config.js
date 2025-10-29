/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        // Mobile: < 640px (default)
        sm: '640px', // Tablet
        md: '768px', // Tablet
        lg: '1024px', // Desktop
        xl: '1440px', // Large Desktop
      },
    },
  },
  plugins: [],
};

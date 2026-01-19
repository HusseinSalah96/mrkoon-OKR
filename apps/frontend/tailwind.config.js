/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        main: '#4AB969',
        'light-main': '#DFFFE8',
        secondary: '#102935',
        secondary2: "#1E4456",
        'light-secondary': 'rgba(16, 41, 53, 0.1)', 
        'light-error': '#FDEBE9',
        'brand-yellow': "#F5E129",
        'brand-orange': '#EEBC31',
        'brand-blue': '#157EFB',
        'background-gray': '#F5F5F5',
        'background-line': '#EBEBEB'
      }
    },
  },
  plugins: [],
}

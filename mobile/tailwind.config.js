/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#667eea',
          600: '#5a6fd8',
          700: '#4f46e5',
        },
        secondary: {
          500: '#764ba2',
        },
        success: {
          500: '#28a745',
          600: '#218838',
        },
        danger: {
          500: '#dc3545',
          600: '#c82333',
        },
      },
    },
  },
  plugins: [],
}

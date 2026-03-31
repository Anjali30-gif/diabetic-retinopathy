/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBase: '#0A2540',
        agBlue: '#007BFF',
        agGreen: '#10b981',
        agRed: '#ef4444',
        agOrange: '#f97316'
      },
      borderRadius: {
        '20': '20px',
      }
    },
  },
  plugins: [],
}

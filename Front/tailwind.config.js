/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgPrimary: '#0f172a',
        bgSecondary: '#1e293b',
        accent: '#38bdf8',
        accentHover: '#0ea5e9',
      }
    },
  },
  plugins: [],
}



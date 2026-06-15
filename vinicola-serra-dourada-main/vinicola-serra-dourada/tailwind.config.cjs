/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial", "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji"],
      },
      colors: {
        gold: {
          50: "#fff9e6",
          100: "#ffefbf",
          200: "#ffe08a",
          300: "#f7c948",
          400: "#e0b12d",
          500: "#c99a1a",
          600: "#a67d14",
          700: "#845f0f",
          800: "#64460b",
          900: "#4a3307",
        },
        wine: {
          50: "#faf6f7",
          100: "#f4eaee",
          200: "#ead3dc",
          300: "#d9a8b8",
          400: "#c17790",
          500: "#a85372",
          600: "#8b3b5a",
          700: "#6f2f49",
          800: "#59263d",
          900: "#4b2134",
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.08)",
      }
    },
  },
  plugins: [],
}

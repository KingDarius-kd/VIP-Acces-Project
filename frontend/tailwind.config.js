/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F1714",
        panel: "#17211D",
        panel2: "#1D2A24",
        brass: "#C9A227",
        "brass-light": "#E4C766",
        ivory: "#EDEAE0",
        sage: "#8FA095",
        emerald: "#4C8C6B",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

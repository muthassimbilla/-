/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "pro-purple": {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        "pro-light": "#e0d4ff",
        "pro-mid": "#b197fc",
        "pro-dark": "#7c3aed",
      },
      backgroundImage: {
        "pro-gradient": "linear-gradient(to right bottom, #e0d4ff, #7c3aed)",
        "pro-gradient-light":
          "linear-gradient(to right bottom, #f5f3ff, #c4b5fd)",
        "pro-gradient-dark":
          "linear-gradient(to right bottom, #7c3aed, #4c1d95)",
      },
      keyframes: {
        "slide-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(100%)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "bounce-gentle": {
          "0%": {
            transform: "translateY(-1%)",
            animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)",
          },
          "50%": {
            transform: "translateY(0)",
            animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
          },
          "100%": {
            transform: "translateY(-1%)",
            animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)",
          },
        },
      },
      animation: {
        "slide-up": "slide-up 0.3s ease-out",
        "bounce-gentle": "bounce-gentle 2s infinite",
      },
      scale: {
        102: "1.02",
      },
    },
  },
  plugins: [],
};

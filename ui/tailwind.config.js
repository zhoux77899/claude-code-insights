import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#CB7C5B",
          light: "#CB7C5B",
          dark: "#CB7C5B",
        },
        page: {
          dark: "#09090B",
          light: "#FDFDF7",
        },
        card: {
          dark: "#1D1917",
          light: "#FFFFFF",
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [heroui()],
}

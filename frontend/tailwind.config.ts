import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // markdown.ts emits utility classes at runtime (embeds, fallback cards);
    // include it so those classes are not purged from the production build.
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FBF8F3",
          100: "#F7F2EA",
          200: "#EFE6D7",
          300: "#E5D8C2",
        },
        blush: {
          100: "#F4E3D7",
          200: "#E8D0BD",
          300: "#D8B098",
        },
        gold: {
          400: "#C9A27E",
          500: "#B5916E",
          600: "#9A7A5A",
          700: "#7E6147",
        },
        ink: {
          900: "#1F1B16",
          800: "#2A2520",
          700: "#3A332C",
          600: "#5A5046",
          500: "#7A6F62",
          400: "#9A8E7F",
        },
        brand: {
          50: "#FBF8F3",
          100: "#F4E3D7",
          200: "#E8D0BD",
          300: "#D8B098",
          400: "#C9A27E",
          500: "#B5916E",
          600: "#9A7A5A",
          700: "#7E6147",
          800: "#5A4634",
          900: "#3A2D22",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      letterSpacing: {
        widest: "0.25em",
      },
      boxShadow: {
        soft: "0 10px 40px -20px rgba(31, 27, 22, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;

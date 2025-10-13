import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f9fafb",
        primary: "#3B82F6",
        "primary-dark": "#2563EB",
        "primary-light": "#60A5FA",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "12px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.05)",
        hover: "0 4px 12px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;


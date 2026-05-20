// tailwind.config.ts (ou tailwind.config.js)
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // 👈 ADICIONE ESTA LINHA
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
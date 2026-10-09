import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: "#1A233B",
        blueprint: {
          DEFAULT: "#3151FE",
          dark: "#2540D6",
          light: "#EAF1FF",
        },
        sky: "#EAF1FF",
        paper: "#F8FAFC",
        line: "#E2E8F0",
        slate2: "#64748B",
        stock: "#F97316",
        wa: "#25D366",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;

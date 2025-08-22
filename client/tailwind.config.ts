import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"
import typography from "@tailwindcss/typography"

export default {
  darkMode: ["class"],
  // ⬇️ client 디렉터리 기준으로 수정
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        popover: { DEFAULT: "var(--popover)", foreground: "var(--popover-foreground)" },
        primary: { DEFAULT: "var(--primary)", foreground: "var(--primary-foreground)" },
        secondary:{ DEFAULT: "var(--secondary)", foreground: "var(--secondary-foreground)" },
        muted:   { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        accent:  { DEFAULT: "var(--accent)", foreground: "var(--accent-foreground)" },
        destructive: { DEFAULT: "var(--destructive)", foreground: "var(--destructive-foreground)" },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        "lab-blue": "var(--lab-blue)",
        "lab-slate": "var(--lab-slate)",
        "lab-sky": "var(--lab-sky)",
        "lab-gray": "var(--lab-gray)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
        inter: ["Inter","sans-serif"],
      },
      keyframes: {
        "accordion-down": { from: { height:"0" }, to: { height:"var(--radix-accordion-content-height)" } },
        "accordion-up":   { from: { height:"var(--radix-accordion-content-height)" }, to: { height:"0" } },
        slideIn: { from:{ transform:"translateY(30px)", opacity:"0" }, to:{ transform:"translateY(0)", opacity:"1" } },
        fadeIn:  { from:{ opacity:"0" }, to:{ opacity:"1" } },
        scaleHover: { from:{ transform:"scale(1)" }, to:{ transform:"scale(1.05)" } },
      },
      animation: {
        "accordion-down":"accordion-down 0.2s ease-out",
        "accordion-up":"accordion-up 0.2s ease-out",
        "slide-in":"slideIn 0.8s ease-out",
        "fade-in":"fadeIn 1s ease-out",
        "scale-hover":"scaleHover 0.3s ease-out",
      },
    },
  },
  plugins: [animate, typography],
} satisfies Config

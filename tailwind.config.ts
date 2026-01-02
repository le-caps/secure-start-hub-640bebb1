import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        risk: {
          high: {
            DEFAULT: "hsl(var(--risk-high))",
            foreground: "hsl(var(--risk-high-foreground))",
            bg: "hsl(var(--risk-high-bg))",
            border: "hsl(var(--risk-high-border))",
          },
          medium: {
            DEFAULT: "hsl(var(--risk-medium))",
            foreground: "hsl(var(--risk-medium-foreground))",
            bg: "hsl(var(--risk-medium-bg))",
            border: "hsl(var(--risk-medium-border))",
          },
          low: {
            DEFAULT: "hsl(var(--risk-low))",
            foreground: "hsl(var(--risk-low-foreground))",
            bg: "hsl(var(--risk-low-bg))",
            border: "hsl(var(--risk-low-border))",
          },
        },
        priority: {
          high: {
            DEFAULT: "hsl(var(--priority-high))",
            bg: "hsl(var(--priority-high-bg))",
            border: "hsl(var(--priority-high-border))",
          },
          medium: {
            DEFAULT: "hsl(var(--priority-medium))",
            bg: "hsl(var(--priority-medium-bg))",
            border: "hsl(var(--priority-medium-border))",
          },
          low: {
            DEFAULT: "hsl(var(--priority-low))",
            bg: "hsl(var(--priority-low-bg))",
            border: "hsl(var(--priority-low-border))",
          },
        },
        hubspot: {
          DEFAULT: "#ff7a59",
          hover: "#ff5c35",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

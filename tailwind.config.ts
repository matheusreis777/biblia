import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  // Os tokens claros vivem em :root e os escuros em .dark — a classe é posta no
  // <html> pelo script anti-flash do index.html e mantida pelo ThemeProvider.
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "xs": "400px",
        "2xl": "1400px",
      },
    },
    extend: {
      // Fica em `extend.screens`, não em `container.screens`: aquele configura
      // só o utilitário .container e nunca gerou a variante `xs:`.
      screens: {
        xs: "400px",
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'monospace'],
        body: ['"Inter"', 'sans-serif'],
        // Serifa de tela para o texto bíblico. Independente das famílias
        // `Reel*`, que são arquivos .ttf medidos pelo servidor.
        reading: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
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
        /** Banda de seleção do versículo — não é `primary`, é mais quieta. */
        highlight: "hsl(var(--highlight))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        // Sombras próprias: as do Tailwind são calibradas para fundo claro e
        // somem no tema escuro. Estas usam a variável, que muda por tema.
        soft: "0 1px 2px hsl(var(--shadow-color) / 0.04), 0 4px 12px hsl(var(--shadow-color) / 0.06)",
        lift: "0 2px 4px hsl(var(--shadow-color) / 0.06), 0 12px 32px hsl(var(--shadow-color) / 0.12)",
        overlay: "0 8px 16px hsl(var(--shadow-color) / 0.12), 0 24px 64px hsl(var(--shadow-color) / 0.24)",
      },
      keyframes: {
        // Varredura do skeleton de carregamento.
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;

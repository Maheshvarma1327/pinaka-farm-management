/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        sidebar: "var(--color-navbar-bg)",
        surface: "var(--color-page-bg)",
        cardBg: "var(--color-card-bg)",
        cardHover: "var(--color-card-hover)",
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          bg: "var(--color-primary-bg)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
        },
        borderDark: "var(--color-border)",
        borderStrong: "var(--color-border-strong)",
        textPrimary: "var(--color-text-primary)",
        textSecondary: "var(--color-text-secondary)",
        textMuted: "var(--color-text-muted)",
        success: {
          DEFAULT: "var(--color-success)",
          bg: "var(--color-success-bg)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          bg: "var(--color-warning-bg)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          bg: "var(--color-danger-bg)",
        },
        blueAccent: {
          DEFAULT: "var(--color-info)",
          bg: "var(--color-info-bg)",
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 12px rgba(0, 200, 150, 0.08)',
        glowDanger: '0 0 12px rgba(239, 68, 68, 0.08)',
      }
    },
  },
  plugins: [],
}

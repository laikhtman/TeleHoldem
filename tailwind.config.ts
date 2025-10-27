import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      /* ==================== SPACING USING TOKENS ==================== */
      spacing: {
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
        '4xl': 'var(--spacing-4xl)',
        '5xl': 'var(--spacing-5xl)',
      },
      /* ==================== TYPOGRAPHY USING TOKENS ==================== */
      fontSize: {
        'xs': ['var(--font-size-xs)', { lineHeight: 'var(--line-height-tight)' }],
        'sm': ['var(--font-size-sm)', { lineHeight: 'var(--line-height-normal)' }],
        'base': ['var(--font-size-base)', { lineHeight: 'var(--line-height-normal)' }],
        'lg': ['var(--font-size-lg)', { lineHeight: 'var(--line-height-relaxed)' }],
        'xl': ['var(--font-size-xl)', { lineHeight: 'var(--line-height-relaxed)' }],
        '2xl': ['var(--font-size-2xl)', { lineHeight: 'var(--line-height-snug)' }],
        '3xl': ['var(--font-size-3xl)', { lineHeight: 'var(--line-height-snug)' }],
        '4xl': ['var(--font-size-4xl)', { lineHeight: 'var(--line-height-tight)' }],
        '5xl': ['var(--font-size-5xl)', { lineHeight: 'var(--line-height-tight)' }],
      },
      fontWeight: {
        thin: 'var(--font-weight-thin)',
        light: 'var(--font-weight-light)',
        normal: 'var(--font-weight-normal)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
        extrabold: 'var(--font-weight-extrabold)',
        black: 'var(--font-weight-black)',
      },
      lineHeight: {
        'none': 'var(--line-height-none)',
        'tight': 'var(--line-height-tight)',
        'snug': 'var(--line-height-snug)',
        'normal': 'var(--line-height-normal)',
        'relaxed': 'var(--line-height-relaxed)',
        'loose': 'var(--line-height-loose)',
      },
      letterSpacing: {
        tighter: 'var(--letter-spacing-tighter)',
        tight: 'var(--letter-spacing-tight)',
        normal: 'var(--letter-spacing-normal)',
        wide: 'var(--letter-spacing-wide)',
        wider: 'var(--letter-spacing-wider)',
        widest: 'var(--letter-spacing-widest)',
      },
      /* ==================== RADIUS USING TOKENS ==================== */
      borderRadius: {
        none: 'var(--radius-none)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        DEFAULT: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
      /* ==================== SHADOWS USING TOKENS ==================== */
      boxShadow: {
        none: 'var(--shadow-none)',
        '2xs': 'var(--shadow-2xs)',
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        inner: 'var(--shadow-inner)',
      },
      /* ==================== ANIMATION USING TOKENS ==================== */
      transitionDuration: {
        'fastest': 'var(--transition-fastest)',
        'faster': 'var(--transition-faster)',
        'fast': 'var(--transition-fast)',
        DEFAULT: 'var(--transition-base)',
        'slow': 'var(--transition-slow)',
        'slower': 'var(--transition-slower)',
        'slowest': 'var(--transition-slowest)',
      },
      transitionTimingFunction: {
        'linear': 'var(--ease-linear)',
        'in': 'var(--ease-in)',
        'out': 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
        'spring': 'var(--ease-spring)',
      },
      /* ==================== Z-INDEX USING TOKENS ==================== */
      zIndex: {
        'base': 'var(--z-base)',
        'dropdown': 'var(--z-dropdown)',
        'sticky': 'var(--z-sticky)',
        'fixed': 'var(--z-fixed)',
        'overlay': 'var(--z-overlay)',
        'modal': 'var(--z-modal)',
        'popover': 'var(--z-popover)',
        'tooltip': 'var(--z-tooltip)',
        'notification': 'var(--z-notification)',
        'max': 'var(--z-max)',
      },
      /* ==================== COLORS USING TOKENS ==================== */
      colors: {
        // Semantic colors using CSS variables
        'background': {
          DEFAULT: "hsl(var(--color-background) / <alpha-value>)",
          secondary: "hsl(var(--color-background-secondary) / <alpha-value>)",
          tertiary: "hsl(var(--color-background-tertiary) / <alpha-value>)",
          elevated: "hsl(var(--color-background-elevated) / <alpha-value>)",
        },
        'foreground': {
          DEFAULT: "hsl(var(--color-foreground) / <alpha-value>)",
          secondary: "hsl(var(--color-foreground-secondary) / <alpha-value>)",
          tertiary: "hsl(var(--color-foreground-tertiary) / <alpha-value>)",
          muted: "hsl(var(--color-foreground-muted) / <alpha-value>)",
          inverse: "hsl(var(--color-foreground-inverse) / <alpha-value>)",
        },
        'surface': {
          DEFAULT: "hsl(var(--color-surface) / <alpha-value>)",
          secondary: "hsl(var(--color-surface-secondary) / <alpha-value>)",
          tertiary: "hsl(var(--color-surface-tertiary) / <alpha-value>)",
        },
        'border': {
          DEFAULT: "hsl(var(--color-border) / <alpha-value>)",
          secondary: "hsl(var(--color-border-secondary) / <alpha-value>)",
          tertiary: "hsl(var(--color-border-tertiary) / <alpha-value>)",
          focus: "hsl(var(--color-border-focus) / <alpha-value>)",
        },
        'primary': {
          DEFAULT: "hsl(var(--color-primary) / <alpha-value>)",
          hover: "hsl(var(--color-primary-hover) / <alpha-value>)",
          active: "hsl(var(--color-primary-active) / <alpha-value>)",
          foreground: "hsl(var(--color-primary-foreground) / <alpha-value>)",
          border: "var(--primary-border)",
        },
        'secondary': {
          DEFAULT: "hsl(var(--color-secondary) / <alpha-value>)",
          hover: "hsl(var(--color-secondary-hover) / <alpha-value>)",
          active: "hsl(var(--color-secondary-active) / <alpha-value>)",
          foreground: "hsl(var(--color-secondary-foreground) / <alpha-value>)",
          border: "var(--secondary-border)",
        },
        'success': {
          DEFAULT: "hsl(var(--color-success) / <alpha-value>)",
          foreground: "hsl(var(--color-success-foreground) / <alpha-value>)",
        },
        'warning': {
          DEFAULT: "hsl(var(--color-warning) / <alpha-value>)",
          foreground: "hsl(var(--color-warning-foreground) / <alpha-value>)",
        },
        'error': {
          DEFAULT: "hsl(var(--color-error) / <alpha-value>)",
          foreground: "hsl(var(--color-error-foreground) / <alpha-value>)",
        },
        'info': {
          DEFAULT: "hsl(var(--color-info) / <alpha-value>)",
          foreground: "hsl(var(--color-info-foreground) / <alpha-value>)",
        },
        'accent': {
          DEFAULT: "hsl(var(--color-accent) / <alpha-value>)",
          hover: "hsl(var(--color-accent-hover) / <alpha-value>)",
          active: "hsl(var(--color-accent-active) / <alpha-value>)",
          foreground: "hsl(var(--color-accent-foreground) / <alpha-value>)",
          border: "var(--accent-border)",
        },
        'muted': {
          DEFAULT: "hsl(var(--color-muted) / <alpha-value>)",
          hover: "hsl(var(--color-muted-hover) / <alpha-value>)",
          active: "hsl(var(--color-muted-active) / <alpha-value>)",
          foreground: "hsl(var(--color-muted-foreground) / <alpha-value>)",
          border: "var(--muted-border)",
        },
        // Interactive states
        'hover': "var(--color-hover)",
        'active': "var(--color-active)",
        'disabled': "var(--color-disabled)",
        'focus': "hsl(var(--color-focus) / <alpha-value>)",
        'selection': "hsl(var(--color-selection) / <alpha-value>)",
        
        // Legacy mappings for backwards compatibility
        // Preserving original color names but now using tokens
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          border: "hsl(var(--card-border) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
          border: "hsl(var(--popover-border) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          border: "var(--destructive-border)",
        },
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        chart: {
          "1": "hsl(var(--chart-1) / <alpha-value>)",
          "2": "hsl(var(--chart-2) / <alpha-value>)",
          "3": "hsl(var(--chart-3) / <alpha-value>)",
          "4": "hsl(var(--chart-4) / <alpha-value>)",
          "5": "hsl(var(--chart-5) / <alpha-value>)",
        },
        sidebar: {
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
          DEFAULT: "hsl(var(--sidebar) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
        },
        "sidebar-primary": {
          DEFAULT: "hsl(var(--sidebar-primary) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          border: "var(--sidebar-primary-border)",
        },
        "sidebar-accent": {
          DEFAULT: "hsl(var(--sidebar-accent) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "var(--sidebar-accent-border)"
        },
        
        // Poker-specific colors using tokens
        poker: {
          felt: "hsl(var(--poker-felt) / <alpha-value>)",
          feltLight: "hsl(var(--poker-felt-light) / <alpha-value>)",
          tableBorder: "hsl(var(--poker-table-border) / <alpha-value>)",
          cardBg: "hsl(var(--poker-card-bg) / <alpha-value>)",
          cardRed: "hsl(var(--poker-card-red) / <alpha-value>)",
          cardBlack: "hsl(var(--poker-card-black) / <alpha-value>)",
          chipGold: "hsl(var(--poker-chip-gold) / <alpha-value>)",
          success: "hsl(var(--poker-success) / <alpha-value>)",
        },
        
        // Status colors (keeping as-is for now, but could be tokenized)
        status: {
          online: "rgb(34 197 94)",
          away: "rgb(245 158 11)",
          busy: "rgb(239 68 68)",
          offline: "rgb(156 163 175)",
        },
      },
      /* ==================== FONT FAMILIES USING TOKENS ==================== */
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      /* ==================== ANIMATIONS - Now use token durations ==================== */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "deal-card": {
          from: { transform: "translate(-50%, -50%) scale(0.5)", opacity: "0" },
          to: { transform: "translate(0, 0) scale(1)", opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 10px hsl(var(--poker-chip-gold))" },
          "50%": { boxShadow: "0 0 20px hsl(var(--poker-chip-gold))" },
        },
        "pot-bounce": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down var(--transition-fast) ease-out",
        "accordion-up": "accordion-up var(--transition-fast) ease-out",
        "deal-card": "deal-card var(--transition-base) ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "pot-bounce": "pot-bounce var(--transition-fast) ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
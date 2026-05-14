/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ig: {
          bg: "#000000",
          surface: "#0a0a0a",
          card: "#121212",
          elevated: "#1a1a1a",
          border: "#262626",
          borderSoft: "#1f1f1f",
          text: "#fafafa",
          textSoft: "#a8a8a8",
          textDim: "#737373",
          accent: "#e1306c",
          link: "#0095f6",
          success: "#00d26a",
          warning: "#ff9800",
          danger: "#ed4956",
        },
      },
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['"Grandstander"', '"Billabong"', 'cursive'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        ig: "0 1px 0 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.04)",
        glow: "0 0 0 1px rgba(225,48,108,0.4), 0 0 24px -8px rgba(225,48,108,0.6)",
      },
      backgroundImage: {
        "ig-gradient": "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
      },
    },
  },
  plugins: [],
};

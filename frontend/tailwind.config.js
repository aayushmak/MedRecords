/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        // Simple, flat blue/white palette — no gradients used anywhere in the UI.
        primary: {
          DEFAULT: "#1D4ED8", // main blue
          dark: "#1E3A8A",
          light: "#3B82F6",
          soft: "#EFF6FF", // pale blue background/hover
        },
        ink: "#0F172A",
        muted: "#64748B",
        border: "#E2E8F0",
        success: "#15803D",
        danger: "#B91C1C",
      },
      fontFamily: {
        sans: ["Inter", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

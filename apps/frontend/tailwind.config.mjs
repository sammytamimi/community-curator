/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      fontSize: {
        display: ["64px", { lineHeight: "72px", letterSpacing: "-0.02em", fontWeight: "800" }],
        h1: ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "800" }],
        h2: ["40px", { lineHeight: "48px", fontWeight: "700" }],
        h3: ["32px", { lineHeight: "40px", fontWeight: "700" }],
      },
      borderRadius: {
        xl2: "1.25rem", // 20px, extra-rounded for cards
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
}; 
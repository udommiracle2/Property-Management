/** @type {import("tailwindcss").Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Landlord palette (Space Indigo / Vintage Grape / Golden Pollen /
        // Dark Cyan / Blue Slate). `brand` is the primary action ramp
        // (anchored on Vintage Grape); the raw palette is also exposed as
        // `landlord.*` for chrome/accents (sidebar bg, highlight badges).
        brand: {
          50:  "#f4f3f7",
          100: "#e6e4eb",
          200: "#c9c5d5",
          300: "#a9a3bb",
          400: "#7d7599",
          500: "#4b3f72",
          600: "#3f3560",
          700: "#332b4e",
          800: "#27213b",
          900: "#1d182b"
        },
        landlord: {
          indigo: "#1F2041",
          grape:  "#4B3F72",
          gold:   "#FFC857",
          cyan:   "#119DA4",
          slate:  "#19647E"
        },
        // Tenant palette (Honey Bronze / Amaranth / Stormy Teal / Baltic
        // Blue / Yale Blue). `resident` is the primary action ramp
        // (anchored on Amaranth); raw palette exposed as `tenant.*`.
        resident: {
          50:  "#fcf4f5",
          100: "#f9e6e8",
          200: "#f1c8ce",
          300: "#e9a8b0",
          400: "#de7c89",
          500: "#d1495b",
          600: "#b03d4c",
          700: "#8e323e",
          800: "#6d262f",
          900: "#4f1c23"
        },
        tenant: {
          bronze: "#EDAE49",
          amaranth: "#D1495B",
          teal:   "#00798C",
          baltic: "#30638E",
          yale:   "#003D5B"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft:  "0 6px 24px -8px rgba(15, 23, 42, 0.12)",
        ring:  "0 0 0 4px rgba(99,102,241,0.15)",
        glow:  "0 0 30px -10px rgba(99,102,241,0.35)"
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out",
        "slide-up": "slideUp 0.35s cubic-bezier(0.16,1,0.3,1)"
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp: { "0%": { opacity: 0, transform: "translateY(10px)" }, "100%": { opacity: 1, transform: "translateY(0)" } }
      }
    }
  },
  plugins: []
};

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bay: {
          50: "#eef9f8",
          100: "#d4efec",
          500: "#237c78",
          600: "#1b6664",
          900: "#173d3c"
        }
      }
    }
  },
  plugins: []
};

export default config;

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}', // only if you still have /pages
    './stories/**/*.{js,ts,jsx,tsx,mdx}', // optional
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          '"Helvetica Neue"',
          "sans-serif",
        ],
      },
    },
  },
  safelist: [{ pattern: /^(bg|text|border)-(gray|sky|blue|black)-(50|100|200|300|400|500|600|700|800|900)$/ }],

  plugins: [],
};

export default config;

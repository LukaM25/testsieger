import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}', // if you still have pages/
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['var(--font-sans)'] },
    },
  },
  plugins: [],
} satisfies Config;

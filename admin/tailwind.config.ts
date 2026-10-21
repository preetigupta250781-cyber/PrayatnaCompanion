import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#08090E',
        surface: '#0F1420',
        surfaceElevated: '#171E30',
        surfaceHighlight: '#1F2940',
        card: '#0F1420',
        cardBorder: '#1F2940',
        border: '#232D45',
        accent: '#00F0FF',
        accentMuted: 'rgba(0, 240, 255, 0.12)',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
    },
  },
  plugins: [],
};

export default config;

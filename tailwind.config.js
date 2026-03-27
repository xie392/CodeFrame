/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 背景色
        'bg-primary': '#0A0A0A',
        'bg-secondary': '#0F0F0F',
        'bg-tertiary': '#1F1F1F',
        
        // 文字色
        'text-primary': '#FAFAFA',
        'text-secondary': '#6B7280',
        'text-tertiary': '#4B5563',
        
        // 强调色
        accent: {
          DEFAULT: '#10B981',
          hover: '#059669',
        },
        warning: '#F59E0B',
        info: '#06B6D4',
        error: '#EF4444',
        
        // 边框色
        border: '#2a2a2a',
      },
      fontFamily: {
        mono: [
          'JetBrains Mono',
          'IBM Plex Mono',
          'ui-monospace',
          'monospace',
        ],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
      },
      borderRadius: {
        none: '0',
      },
    },
  },
  plugins: [],
}

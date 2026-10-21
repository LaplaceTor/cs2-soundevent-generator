/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          '"微软雅黑"',
          '"WenQuanYi Micro Hei"',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          '"Cascadia Code"',
          '"Cascadia Mono"',
          'Consolas',
          '"Segoe UI Mono"',
          'ui-monospace',
          'Menlo',
          'Monaco',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          '"微软雅黑"',
          'monospace',
        ],
      },
      colors: {
        charcoal: '#111827',
        lightBorder: '#E5E7EB',
        darkBorder: '#1F2937',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#172026',
        slate: '#52616b',
        mist: '#f4f7f8',
        line: '#d8e1e5',
        brand: '#1f7a8c',
        success: '#228b5f',
        warning: '#b7791f'
      },
      boxShadow: {
        panel: '0 10px 30px rgba(23, 32, 38, 0.08)'
      }
    }
  },
  plugins: []
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#121212',
        'bg-secondary': '#181818',
        'bg-highlight': '#282828',
        'text-primary': '#ffffff',
        'text-secondary': '#b3b3b3',
        'accent': '#1db954',
        'accent-hover': '#1ed760',
        'primary': '#121212', // Alias for easier usage if needed
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

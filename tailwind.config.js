module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        custom: '#943BA5',
        gray: {
          800: '#1F2937',
          900: '#111827',
        }
      },
      fontFamily: {
        'pacifico': ['Pacifico', 'cursive'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}

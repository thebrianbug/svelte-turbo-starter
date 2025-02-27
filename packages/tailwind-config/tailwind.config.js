/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // App source files
    '../../apps/*/src/**/*.{html,js,svelte,ts}',
    // Include shared UI components
    '../../packages/ui/**/*.{js,ts,jsx,tsx,svelte}'
  ],
  theme: {
    extend: {
      // Add any custom theme extensions here
      colors: {
        // Example custom color palette
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}

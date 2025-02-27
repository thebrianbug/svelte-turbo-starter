const { join } = require('path');
const tailwindNesting = require('@tailwindcss/nesting');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

module.exports = {
  plugins: [
    tailwindNesting,
    tailwindcss({
      config: join(__dirname, 'tailwind.config.js')
    }),
    autoprefixer
  ]
};

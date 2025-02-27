const path = require('path');

module.exports = {
  plugins: {
    'postcss-nesting': {},
    tailwindcss: {
      config: path.join(__dirname, 'tailwind.config.js')
    },
    autoprefixer: {}
  }
};

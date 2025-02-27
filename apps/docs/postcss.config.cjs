module.exports = {
  plugins: {
    tailwindcss: {
      config: require.resolve('@repo/tailwind-config/tailwind.config.js'),
    },
    autoprefixer: {},
  },
}

const react = require("@vitejs/plugin-react");
const reactNative = require("./packages/vitest-react-native/plugin");
const { defineConfig } = require("vite");

module.exports = defineConfig({
  plugins: [reactNative(), react()],
});

const react = require("@vitejs/plugin-react");
const reactNative = require("./packages/vitest-react-native/plugin");
const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  plugins: [reactNative(), react()],
});

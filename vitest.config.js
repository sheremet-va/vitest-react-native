const { flowPlugin } = require("@bunchtogether/vite-plugin-flow");
const react = require("@vitejs/plugin-react");
const { defineConfig } = require("vite");

module.exports = defineConfig({
  plugins: [
    flowPlugin({ exclude: [], include: [/react-native/] }),
    react({ exclude: [], include: [/react-native/] }),
  ],
  resolve: {
    conditions: ["react-native"],
  },
  test: {
    setupFiles: ["setup.jsx"],
    globals: true,
  },
});

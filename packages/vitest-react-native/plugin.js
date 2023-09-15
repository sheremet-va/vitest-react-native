const { resolve } = require("path");

module.exports = () => {
  /** @type {import('vite').Plugin} */
  const plugin = {
    name: "vitest-plugin-react-native",
    config: () => {
      return {
        resolve: {
          extensions: [
            '.ios.js',
            '.ios.jsx',
            '.ios.ts',
            '.ios.tsx',
            '.mjs',
            '.js',
            '.mts',
            '.ts',
            '.jsx',
            '.tsx',
            '.json'
          ],
          conditions: ["react-native"],
        },
        test: {
          setupFiles: [resolve(__dirname, "setup.js")],
          globals: true,
        },
      };
    },
  };
  return plugin
};

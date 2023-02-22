const { resolve } = require("path");

module.exports = () => {
  return {
    name: "vitest-plugin-react-native",
    config: () => {
      return {
        resolve: {
          conditions: ["react-native"],
        },
        test: {
          setupFiles: [resolve(__dirname, "setup.js")],
          globals: true,
        },
      };
    },
  };
};

# vitest-react-native

> **Warning**
> This package is still WIP. If you encounter any errors, feel free to open an issue or a pull request.

## Installing

To add support for `react-native` to Vitest, you need to install this plugin and add it to your Vitest configuration file.

```shell
# with npm
npm install vitest-react-native -D

# with yarn
yarn add vitest-react-native -D

# with pnpm
pnpm add vitest-react-native -D

# with bun
bun add vitest-react-native -D
```

## Usage

```js
// vitest.config.mjs
import reactNative from "vitest-react-native";
// this is needed for react jsx support
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [reactNative(), react()],
});
```

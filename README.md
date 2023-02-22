# vitest-react-native

> **Warning**
> This package is still WIP. If you encounter any errors, feel free to open an issue or a pull request.

To add support for `react-native` to Vitest, you need to install this plugin and add it to your Vitest configuration file.

```shell
npm install vitest-react-native -D
```

```shell
yarn add vitest-react-native -D
```

```shell
pnpm add vitest-react-native -D
```

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

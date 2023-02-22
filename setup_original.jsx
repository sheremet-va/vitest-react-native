/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

"use strict";

// const mockComponent = jest.requireActual("./mockComponent");

jest.requireActual("@react-native/js-polyfills/Object.es8");
jest.requireActual("@react-native/js-polyfills/error-guard");

global.__DEV__ = true;

global.performance = {
  now: jest.fn(Date.now),
};

global.regeneratorRuntime = jest.requireActual("regenerator-runtime/runtime");
global.window = global;

global.requestAnimationFrame = function (callback) {
  return setTimeout(() => callback(jest.now()), 0);
};
global.cancelAnimationFrame = function (id) {
  clearTimeout(id);
};

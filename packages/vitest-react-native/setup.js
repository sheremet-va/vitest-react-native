const addHook = require("pirates").addHook;
const removeTypes = require("flow-remove-types");
const esbuild = require("esbuild");
const fs = require('fs')
const os = require('os')
const path = require('path')
const reactNativePkg = require('react-native/package.json')
const pluginPkg = require('./package.json')

const tmpDir = os.tmpdir()
const cacheDirBase = path.join(tmpDir, 'vrn')
const version = reactNativePkg.version + pluginPkg.version
const cacheDir = path.join(cacheDirBase, version)
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true })
}
const cacheDirFolders = fs.readdirSync(cacheDirBase)
cacheDirFolders.forEach(version => {
  // remove old cache
  if (version !== version) {
    fs.rmdirSync(path.join(cacheDirBase, version))
  }
})

const root = process.cwd()

const mocked = [];
// TODO: better check
const getMocked = (path) => mocked.find(([p]) => path.includes(p));

const crossPlatformFiles = [
  "Settings",
  "BaseViewConfig",
  "RCTAlertManager",
  "PlatformColorValueTypes",
  "PlatformColorValueTypesIOS",
  "PlatformColorValueTypesIOS",
  "RCTNetworking",
  "Image",
  "Platform",
  "LoadingView",
  "LoadingView",
  "BackHandler",
  "ProgressViewIOS",
  "ProgressBarAndroid",
  "legacySendAccessibilityEvent",
  "DatePickerIOS",
  "DatePickerIOS.flow",
  "DrawerLayoutAndroid",
  "ToastAndroid",
];

const platformRegexp = new RegExp(
  // processed code always has " as quotes
  `require\\("([\\w.\\d\/]+/(${crossPlatformFiles.join("|")}))"\\)`,
  "g"
);

// we need to process react-native dependency, because they ship flow types
// removing types is not enough, we also need to convert ESM imports/exports into CJS
const transformCode = (code) => {
  const result = removeTypes(code).toString();
  return esbuild
    .transformSync(result, {
      loader: "jsx",
      format: "cjs",
      platform: "node",
    })
    .code.replace(platformRegexp, 'require("$1.ios")');
};

const normalize = (path) => path.replace(/\\/g, "/");

const cacheExists = (cachePath) => fs.existsSync(cachePath)
const readFromCache = (cachePath) => fs.readFileSync(cachePath, 'utf-8')
const writeToCache = (cachePath, code) => fs.writeFileSync(cachePath, code)

const processBinary = (code, filename) => {
  const b64 = Buffer.from(code).toString('base64')
  return `module.exports = Buffer.from("${b64}", "base64")`
}

addHook(
  (code, filename) => {
    return processBinary(code, filename)
  },
  {
    exts: [".png", ".jpg"],
    ignoreNodeModules: false
  }
)

require.extensions['.ios.js'] = require.extensions['.js']

const processReactNative = (code, filename) => {
  const cacheName = normalize(path.relative(root, filename)).replace(/\//g, '_')
  const cachePath = path.join(cacheDir, cacheName)
  if (cacheExists(cachePath))
    return readFromCache(cachePath, 'utf-8')
  const mock = getMocked(filename);
  if (mock) {
    const original = mock[1].includes("__vitest__original__")
      ? `const __vitest__original__ = ((module, exports) => {
      ${transformCode(code)}
      return module.exports
    })(module, exports);`
      : "";
    const mockCode = `
    ${original}
    ${mock[1]}
    `;
    writeToCache(cachePath, mockCode)
    return mockCode;
  }
  const transformed = transformCode(code);
  writeToCache(cachePath, transformed)
  return transformed
}

addHook(
  (code, filename) => {
    return processReactNative(code, filename)
  },
  {
    exts: [".js"],
    ignoreNodeModules: false,
    matcher: (id) => {
      const path = normalize(id)
      return (
        (path.includes("/node_modules/react-native/")
        || path.includes("/node_modules/@react-native/"))
        // renderer doesn't have jsx inside and it's too big to process
        && !path.includes('Renderer/implementations')
      )
    }
  }
);

// adapted from https://github.com/facebook/react-native/blob/main/jest/setup.js

require("@react-native/polyfills/Object.es8");
// require("@react-native/polyfills/error-guard");

Object.defineProperties(globalThis, {
  __DEV__: {
    configurable: true,
    enumerable: true,
    value: true,
    writable: true,
  },
  cancelAnimationFrame: {
    configurable: true,
    enumerable: true,
    value: id => clearTimeout(id),
    writable: true,
  },
  performance: {
    configurable: true,
    enumerable: true,
    value: {
      now: vi.fn(Date.now),
    },
    writable: true,
  },
  regeneratorRuntime: {
    configurable: true,
    enumerable: true,
    value: require('regenerator-runtime/runtime'),
    writable: true,
  },
  requestAnimationFrame: {
    configurable: true,
    enumerable: true,
    value: callback => setTimeout(() => callback(vi.getRealSystemTime()), 0),
    writable: true,
  },
  window: {
    configurable: true,
    enumerable: true,
    value: global,
    writable: true,
  },
})

const mock = (path, mock) => {
  if (typeof mock !== "function") {
    throw new Error(
      `mock must be a function, got ${typeof mock} instead for ${path}`
    );
  }
  mocked.push([path, `module.exports = ${mock()}`]);
};

const mockComponent = (moduleName, instanceMethods, isESModule = false, customSetup = '') => {
  return `(() => {const RealComponent = ${isESModule}
    ? __vitest__original__.default
    : __vitest__original__;
  const React = require('react');

  const SuperClass =
    typeof RealComponent === 'function' ? RealComponent : React.Component;

  const name =
    RealComponent.displayName ||
    RealComponent.name ||
    (RealComponent.render // handle React.forwardRef
      ? RealComponent.render.displayName || RealComponent.render.name
      : 'Unknown');

  const nameWithoutPrefix = name.replace(/^(RCT|RK)/, '');

  const Component = class extends SuperClass {
    static displayName = 'Component';

    render() {
      const props = Object.assign({}, RealComponent.defaultProps);

      if (this.props) {
        Object.keys(this.props).forEach(prop => {
          // We can't just assign props on top of defaultProps
          // because React treats undefined as special and different from null.
          // If a prop is specified but set to undefined it is ignored and the
          // default prop is used instead. If it is set to null, then the
          // null value overwrites the default value.
          if (this.props[prop] !== undefined) {
            props[prop] = this.props[prop];
          }
        });
      }

      return React.createElement(nameWithoutPrefix, props, this.props.children);
    }
  };

  Component.displayName = nameWithoutPrefix;

  Object.keys(RealComponent).forEach(classStatic => {
    Component[classStatic] = RealComponent[classStatic];
  });

  ${
    instanceMethods
      ? `Object.assign(Component.prototype, ${instanceMethods});`
      : ""
  }

  ${customSetup}

  return Component;
})()`;
};

const mockModal = () => {
  return `((BaseComponent) => {
    const React = require('react')
    ${transformCode(`class ModalMock extends BaseComponent {
    render() {
      return (
        <BaseComponent {...this.props}>
          {this.props.visible !== true ? null : this.props.children}
        </BaseComponent>
      );
    }
  }`)}
  return ModalMock;
})
  `;
};

const mockScrollView = () => {
  return `((BaseComponent) => {
    const requireNativeComponent = require("react-native/Libraries/ReactNative/requireNativeComponent");
    const RCTScrollView = requireNativeComponent('RCTScrollView');
    const React = require('react')
    const View = require('react-native/Libraries/Components/View/View')
    return ${transformCode(`class ScrollViewMock extends BaseComponent {
      render() {
        return (
          <RCTScrollView {...this.props}>
            {this.props.refreshControl}
            <View>{this.props.children}</View>
          </RCTScrollView>
        );
      }
    }`)}
  })`;
};

const MockNativeMethods = `
  measure: vi.fn(),
  measureInWindow: vi.fn(),
  measureLayout: vi.fn(),
  setNativeProps: vi.fn(),
  focus: vi.fn(),
  blur: vi.fn(),
`;

mock("react-native/Libraries/Core/InitializeCore", () => "{}");
mock(
  "react-native/Libraries/Core/NativeExceptionsManager",
  () => `{
    __esModule: true,
    default: {
      reportfatalexception: vi.fn(),
      reportSoftException: vi.fn(),
      updateExceptionMessage: vi.fn(),
      dismissRedbox: vi.fn(),
      reportException: vi.fn(),
    }
  }`
);
mock(
  "react-native/Libraries/ReactNative/UIManager",
  () => `{
    AndroidViewPager: {
      Commands: {
        setPage: vi.fn(),
        setPageWithoutAnimation: vi.fn(),
      },
    },
    blur: vi.fn(),
    createView: vi.fn(),
    customBubblingEventTypes: {},
    customDirectEventTypes: {},
    dispatchViewManagerCommand: vi.fn(),
    focus: vi.fn(),
    getViewManagerConfig: vi.fn((name) => {
      if (name === "AndroidDrawerLayout") {
        return {
          Constants: {
            DrawerPosition: {
              Left: 10,
            },
          },
        };
      }
    }),
    hasViewManagerConfig: vi.fn((name) => {
      return name === "AndroidDrawerLayout";
    }),
    measure: vi.fn(),
    manageChildren: vi.fn(),
    removeSubviewsFromContainerWithID: vi.fn(),
    replaceExistingNonRootView: vi.fn(),
    setChildren: vi.fn(),
    updateView: vi.fn(),
    AndroidDrawerLayout: {
      Constants: {
        DrawerPosition: {
          Left: 10,
        },
      },
    },
    AndroidTextInput: {
      Commands: {},
    },
    ScrollView: {
      Constants: {},
    },
    View: {
      Constants: {},
    },
  }`
);
mock("react-native/Libraries/Image/Image", () => {
  return mockComponent("react-native/Libraries/Image/Image", '', false, `
  Component.getSize = vi.fn();
  Component.getSizeWithHeaders = vi.fn();
  Component.prefetch = vi.fn();
  Component.prefetchWithMetadata = vi.fn();
  Component.queryCache = vi.fn();
  Component.resolveAssetSource = vi.fn();
  `)
});
mock("react-native/Libraries/Text/Text", () =>
  mockComponent("react-native/Libraries/Text/Text", `{ ${MockNativeMethods} }`)
);
mock("react-native/Libraries/Components/TextInput/TextInput", () =>
  mockComponent(
    "react-native/Libraries/Components/TextInput/TextInput",
    `{
      ${MockNativeMethods}
      isFocused: vi.fn(),
      clear: vi.fn(),
      getNativeRef: vi.fn(),
    }`
  )
);

mock("react-native/Libraries/Modal/Modal", () => {
  const component = mockComponent("react-native/Libraries/Modal/Modal");
  return `${mockModal()}(${component});`;
});

mock("react-native/Libraries/Components/View/View", () =>
  mockComponent(
    "react-native/Libraries/Components/View/View",
    `{ ${MockNativeMethods} }`
  )
);

mock(
  "react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo",
  () => `{
    __esModule: true,
    default: {
      addEventListener: vi.fn(),
      announceForAccessibility: vi.fn(),
      isAccessibilityServiceEnabled: vi.fn(),
      isBoldTextEnabled: vi.fn(),
      isGrayscaleEnabled: vi.fn(),
      isInvertColorsEnabled: vi.fn(),
      isReduceMotionEnabled: vi.fn(),
      prefersCrossFadeTransitions: vi.fn(),
      isReduceTransparencyEnabled: vi.fn(),
      isScreenReaderEnabled: vi.fn(() => Promise.resolve(false)),
      setAccessibilityFocus: vi.fn(),
      sendAccessibilityEvent: vi.fn(),
      getRecommendedTimeoutMillis: vi.fn(),
    },
  }`
);

mock(
  "react-native/Libraries/Components/Clipboard/Clipboard",
  () => `{
    getString: vi.fn(() => ""),
    setString: vi.fn(),
  }`
);

mock(
  "react-native/Libraries/Components/RefreshControl/RefreshControl",
  () =>
    `require("react-native/Libraries/Components/RefreshControl/__mocks__/RefreshControlMock")`
);

mock("react-native/Libraries/Components/ScrollView/ScrollView", () => {
  const component = mockComponent(
    "react-native/Libraries/Components/ScrollView/ScrollView",
    `{
      ${MockNativeMethods}
      getScrollResponder: vi.fn(),
      getScrollableNode: vi.fn(),
      getInnerViewNode: vi.fn(),
      getInnerViewRef: vi.fn(),
      getNativeScrollRef: vi.fn(),
      scrollTo: vi.fn(),
      scrollToEnd: vi.fn(),
      flashScrollIndicators: vi.fn(),
      scrollResponderZoomTo: vi.fn(),
      scrollResponderScrollNativeHandleToKeyboard: vi.fn(),
    }`
  );
  return `${mockScrollView()}(${component});`;
});

mock(
  "react-native/Libraries/Components/ActivityIndicator/ActivityIndicator",
  () => `{
    __esModule: true,
    default: ${mockComponent(
      "react-native/Libraries/Components/ActivityIndicator/ActivityIndicator",
      null,
      true
    )},
  }
  `
);

mock(
  "react-native/Libraries/AppState/AppState",
  () => `{
    addEventListener: vi.fn(() => ({
      remove: vi.fn(),
    })),
  }`
);

mock(
  "react-native/Libraries/Linking/Linking",
  () => `{
    openURL: vi.fn(),
    canOpenURL: vi.fn(() => Promise.resolve(true)),
    openSettings: vi.fn(),
    addEventListener: vi.fn(),
    getInitialURL: vi.fn(() => Promise.resolve()),
    sendIntent: vi.fn(),
  }`
);

mock(
  "react-native/Libraries/BatchedBridge/NativeModules",
  () => `{
    AlertManager: {
      alertWithArgs: vi.fn(),
    },
    AsyncLocalStorage: {
      multiGet: vi.fn((keys, callback) =>
        process.nextTick(() => callback(null, []))
      ),
      multiSet: vi.fn((entries, callback) =>
        process.nextTick(() => callback(null))
      ),
      multiRemove: vi.fn((keys, callback) =>
        process.nextTick(() => callback(null))
      ),
      multiMerge: vi.fn((entries, callback) =>
        process.nextTick(() => callback(null))
      ),
      clear: vi.fn((callback) => process.nextTick(() => callback(null))),
      getAllKeys: vi.fn((callback) =>
        process.nextTick(() => callback(null, []))
      ),
    },
    DeviceInfo: {
      getConstants() {
        return {
          Dimensions: {
            window: {
              fontScale: 2,
              height: 1334,
              scale: 2,
              width: 750,
            },
            screen: {
              fontScale: 2,
              height: 1334,
              scale: 2,
              width: 750,
            },
          },
        };
      },
    },
    DevSettings: {
      addMenuItem: vi.fn(),
      reload: vi.fn(),
    },
    ImageLoader: {
      getSize: vi.fn((url) => Promise.resolve([320, 240])),
      prefetchImage: vi.fn(),
    },
    ImageViewManager: {
      getSize: vi.fn((uri, success) =>
        process.nextTick(() => success(320, 240))
      ),
      prefetchImage: vi.fn(),
    },
    KeyboardObserver: {
      addListener: vi.fn(),
      removeListeners: vi.fn(),
    },
    Networking: {
      sendRequest: vi.fn(),
      abortRequest: vi.fn(),
      addListener: vi.fn(),
      removeListeners: vi.fn(),
    },
    PlatformConstants: {
      getConstants() {
        return {};
      },
    },
    PushNotificationManager: {
      presentLocalNotification: vi.fn(),
      scheduleLocalNotification: vi.fn(),
      cancelAllLocalNotifications: vi.fn(),
      removeAllDeliveredNotifications: vi.fn(),
      getDeliveredNotifications: vi.fn((callback) =>
        process.nextTick(() => [])
      ),
      removeDeliveredNotifications: vi.fn(),
      setApplicationIconBadgeNumber: vi.fn(),
      getApplicationIconBadgeNumber: vi.fn((callback) =>
        process.nextTick(() => callback(0))
      ),
      cancelLocalNotifications: vi.fn(),
      getScheduledLocalNotifications: vi.fn((callback) =>
        process.nextTick(() => callback())
      ),
      requestPermissions: vi.fn(() =>
        Promise.resolve({ alert: true, badge: true, sound: true })
      ),
      abandonPermissions: vi.fn(),
      checkPermissions: vi.fn((callback) =>
        process.nextTick(() =>
          callback({ alert: true, badge: true, sound: true })
        )
      ),
      getInitialNotification: vi.fn(() => Promise.resolve(null)),
      addListener: vi.fn(),
      removeListeners: vi.fn(),
    },
    SourceCode: {
      getConstants() {
        return {
          scriptURL: null,
        };
      },
    },
    StatusBarManager: {
      setColor: vi.fn(),
      setStyle: vi.fn(),
      setHidden: vi.fn(),
      setNetworkActivityIndicatorVisible: vi.fn(),
      setBackgroundColor: vi.fn(),
      setTranslucent: vi.fn(),
      getConstants: () => ({
        HEIGHT: 42,
      }),
    },
    Timing: {
      createTimer: vi.fn(),
      deleteTimer: vi.fn(),
    },
    UIManager: {},
    BlobModule: {
      getConstants: () => ({ BLOB_URI_SCHEME: "content", BLOB_URI_HOST: null }),
      addNetworkingHandler: vi.fn(),
      enableBlobSupport: vi.fn(),
      disableBlobSupport: vi.fn(),
      createFromParts: vi.fn(),
      sendBlob: vi.fn(),
      release: vi.fn(),
    },
    WebSocketModule: {
      connect: vi.fn(),
      send: vi.fn(),
      sendBinary: vi.fn(),
      ping: vi.fn(),
      close: vi.fn(),
      addListener: vi.fn(),
      removeListeners: vi.fn(),
    },
    I18nManager: {
      allowRTL: vi.fn(),
      forceRTL: vi.fn(),
      swapLeftAndRightInRTL: vi.fn(),
      getConstants: () => ({
        isRTL: false,
        doLeftAndRightSwapInRTL: true,
      }),
    },
  }`
);

mock(
  "react-native/Libraries/NativeComponent/NativeComponentRegistry",
  () => `{
    get: vi.fn((name, viewConfigProvider) => {
      const requireNativeComponent = require("react-native/Libraries/ReactNative/requireNativeComponent");
      return requireNativeComponent(name);
    }),
    getWithFallback_DEPRECATED: vi.fn((name, viewConfigProvider) => {
      const requireNativeComponent = require("react-native/Libraries/ReactNative/requireNativeComponent");
      return requireNativeComponent(name);
    }),
    setRuntimeConfigProvider: vi.fn(),
  }`
);

mock(
  "react-native/Libraries/ReactNative/requireNativeComponent",
  () => `(() => {
    const React = require('react')

    let nativeTag = 1

    return viewName => {
      const Component = class extends React.Component {
        _nativeTag = nativeTag++;

        render() {
          return React.createElement(viewName, this.props, this.props.children);
        }

        // The methods that exist on host components
        blur = vi.fn();
        focus = vi.fn();
        measure = vi.fn();
        measureInWindow = vi.fn();
        measureLayout = vi.fn();
        setNativeProps = vi.fn();
      };

      if (viewName === 'RCTView') {
        Component.displayName = 'View';
      } else {
        Component.displayName = viewName;
      }

      return Component;
    };
  })()`
);

mock(
  "react-native/Libraries/Utilities/verifyComponentAttributeEquivalence",
  () => `() => {}`
);
mock(
  "react-native/Libraries/Vibration/Vibration",
  () => `{
    vibrate: vi.fn(),
    cancel: vi.fn(),
  }`
);
mock(
  "react-native/Libraries/Components/View/ViewNativeComponent",
  () => `(() => {
    const React = require("react");
    const Component = class extends React.Component {
      render() {
        return React.createElement("View", this.props, this.props.children);
      }
    };

    Component.displayName = "View";

    return {
      __esModule: true,
      default: Component,
    };
  })()`
);

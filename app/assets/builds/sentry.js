(() => {
  // ../../node_modules/@sentry/core/build/esm/debug-build.js
  var DEBUG_BUILD = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/worldwide.js
  var GLOBAL_OBJ = globalThis;

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/debug-build.js
  var DEBUG_BUILD2 = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/version.js
  var SDK_VERSION = "9.2.0";

  // ../../node_modules/@sentry/core/build/esm/carrier.js
  function getMainCarrier() {
    getSentryCarrier(GLOBAL_OBJ);
    return GLOBAL_OBJ;
  }
  function getSentryCarrier(carrier) {
    const __SENTRY__ = carrier.__SENTRY__ = carrier.__SENTRY__ || {};
    __SENTRY__.version = __SENTRY__.version || SDK_VERSION;
    return __SENTRY__[SDK_VERSION] = __SENTRY__[SDK_VERSION] || {};
  }
  function getGlobalSingleton(name, creator, obj = GLOBAL_OBJ) {
    const __SENTRY__ = obj.__SENTRY__ = obj.__SENTRY__ || {};
    const carrier = __SENTRY__[SDK_VERSION] = __SENTRY__[SDK_VERSION] || {};
    return carrier[name] || (carrier[name] = creator());
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/logger.js
  var PREFIX = "Sentry Logger ";
  var CONSOLE_LEVELS = [
    "debug",
    "info",
    "warn",
    "error",
    "log",
    "assert",
    "trace"
  ];
  var originalConsoleMethods = {};
  function consoleSandbox(callback) {
    if (!("console" in GLOBAL_OBJ)) {
      return callback();
    }
    const console2 = GLOBAL_OBJ.console;
    const wrappedFuncs = {};
    const wrappedLevels = Object.keys(originalConsoleMethods);
    wrappedLevels.forEach((level) => {
      const originalConsoleMethod = originalConsoleMethods[level];
      wrappedFuncs[level] = console2[level];
      console2[level] = originalConsoleMethod;
    });
    try {
      return callback();
    } finally {
      wrappedLevels.forEach((level) => {
        console2[level] = wrappedFuncs[level];
      });
    }
  }
  function makeLogger() {
    let enabled = false;
    const logger2 = {
      enable: () => {
        enabled = true;
      },
      disable: () => {
        enabled = false;
      },
      isEnabled: () => enabled
    };
    if (DEBUG_BUILD2) {
      CONSOLE_LEVELS.forEach((name) => {
        logger2[name] = (...args) => {
          if (enabled) {
            consoleSandbox(() => {
              GLOBAL_OBJ.console[name](`${PREFIX}[${name}]:`, ...args);
            });
          }
        };
      });
    } else {
      CONSOLE_LEVELS.forEach((name) => {
        logger2[name] = () => void 0;
      });
    }
    return logger2;
  }
  var logger = getGlobalSingleton("logger", makeLogger);

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/stacktrace.js
  var STACKTRACE_FRAME_LIMIT = 50;
  var UNKNOWN_FUNCTION = "?";
  var WEBPACK_ERROR_REGEXP = /\(error: (.*)\)/;
  var STRIP_FRAME_REGEXP = /captureMessage|captureException/;
  function createStackParser(...parsers) {
    const sortedParsers = parsers.sort((a, b) => a[0] - b[0]).map((p) => p[1]);
    return (stack, skipFirstLines = 0, framesToPop = 0) => {
      const frames = [];
      const lines = stack.split("\n");
      for (let i = skipFirstLines; i < lines.length; i++) {
        const line = lines[i];
        if (line.length > 1024) {
          continue;
        }
        const cleanedLine = WEBPACK_ERROR_REGEXP.test(line) ? line.replace(WEBPACK_ERROR_REGEXP, "$1") : line;
        if (cleanedLine.match(/\S*Error: /)) {
          continue;
        }
        for (const parser of sortedParsers) {
          const frame = parser(cleanedLine);
          if (frame) {
            frames.push(frame);
            break;
          }
        }
        if (frames.length >= STACKTRACE_FRAME_LIMIT + framesToPop) {
          break;
        }
      }
      return stripSentryFramesAndReverse(frames.slice(framesToPop));
    };
  }
  function stackParserFromStackParserOptions(stackParser) {
    if (Array.isArray(stackParser)) {
      return createStackParser(...stackParser);
    }
    return stackParser;
  }
  function stripSentryFramesAndReverse(stack) {
    if (!stack.length) {
      return [];
    }
    const localStack = Array.from(stack);
    if (/sentryWrapped/.test(getLastStackFrame(localStack).function || "")) {
      localStack.pop();
    }
    localStack.reverse();
    if (STRIP_FRAME_REGEXP.test(getLastStackFrame(localStack).function || "")) {
      localStack.pop();
      if (STRIP_FRAME_REGEXP.test(getLastStackFrame(localStack).function || "")) {
        localStack.pop();
      }
    }
    return localStack.slice(0, STACKTRACE_FRAME_LIMIT).map((frame) => ({
      ...frame,
      filename: frame.filename || getLastStackFrame(localStack).filename,
      function: frame.function || UNKNOWN_FUNCTION
    }));
  }
  function getLastStackFrame(arr) {
    return arr[arr.length - 1] || {};
  }
  var defaultFunctionName = "<anonymous>";
  function getFunctionName(fn) {
    try {
      if (!fn || typeof fn !== "function") {
        return defaultFunctionName;
      }
      return fn.name || defaultFunctionName;
    } catch (e) {
      return defaultFunctionName;
    }
  }
  function getFramesFromEvent(event) {
    const exception = event.exception;
    if (exception) {
      const frames = [];
      try {
        exception.values.forEach((value) => {
          if (value.stacktrace.frames) {
            frames.push(...value.stacktrace.frames);
          }
        });
        return frames;
      } catch (_oO) {
        return void 0;
      }
    }
    return void 0;
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/instrument/handlers.js
  var handlers = {};
  var instrumented = {};
  function addHandler(type, handler) {
    handlers[type] = handlers[type] || [];
    handlers[type].push(handler);
  }
  function maybeInstrument(type, instrumentFn) {
    if (!instrumented[type]) {
      instrumented[type] = true;
      try {
        instrumentFn();
      } catch (e) {
        DEBUG_BUILD2 && logger.error(`Error while instrumenting ${type}`, e);
      }
    }
  }
  function triggerHandlers(type, data) {
    const typeHandlers = type && handlers[type];
    if (!typeHandlers) {
      return;
    }
    for (const handler of typeHandlers) {
      try {
        handler(data);
      } catch (e) {
        DEBUG_BUILD2 && logger.error(
          `Error while triggering instrumentation handler.
Type: ${type}
Name: ${getFunctionName(handler)}
Error:`,
          e
        );
      }
    }
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/instrument/globalError.js
  var _oldOnErrorHandler = null;
  function addGlobalErrorInstrumentationHandler(handler) {
    const type = "error";
    addHandler(type, handler);
    maybeInstrument(type, instrumentError);
  }
  function instrumentError() {
    _oldOnErrorHandler = GLOBAL_OBJ.onerror;
    GLOBAL_OBJ.onerror = function(msg, url, line, column, error) {
      const handlerData = {
        column,
        error,
        line,
        msg,
        url
      };
      triggerHandlers("error", handlerData);
      if (_oldOnErrorHandler) {
        return _oldOnErrorHandler.apply(this, arguments);
      }
      return false;
    };
    GLOBAL_OBJ.onerror.__SENTRY_INSTRUMENTED__ = true;
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/instrument/globalUnhandledRejection.js
  var _oldOnUnhandledRejectionHandler = null;
  function addGlobalUnhandledRejectionInstrumentationHandler(handler) {
    const type = "unhandledrejection";
    addHandler(type, handler);
    maybeInstrument(type, instrumentUnhandledRejection);
  }
  function instrumentUnhandledRejection() {
    _oldOnUnhandledRejectionHandler = GLOBAL_OBJ.onunhandledrejection;
    GLOBAL_OBJ.onunhandledrejection = function(e) {
      const handlerData = e;
      triggerHandlers("unhandledrejection", handlerData);
      if (_oldOnUnhandledRejectionHandler) {
        return _oldOnUnhandledRejectionHandler.apply(this, arguments);
      }
      return true;
    };
    GLOBAL_OBJ.onunhandledrejection.__SENTRY_INSTRUMENTED__ = true;
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/is.js
  var objectToString = Object.prototype.toString;
  function isError(wat) {
    switch (objectToString.call(wat)) {
      case "[object Error]":
      case "[object Exception]":
      case "[object DOMException]":
      case "[object WebAssembly.Exception]":
        return true;
      default:
        return isInstanceOf(wat, Error);
    }
  }
  function isBuiltin(wat, className) {
    return objectToString.call(wat) === `[object ${className}]`;
  }
  function isErrorEvent(wat) {
    return isBuiltin(wat, "ErrorEvent");
  }
  function isDOMError(wat) {
    return isBuiltin(wat, "DOMError");
  }
  function isDOMException(wat) {
    return isBuiltin(wat, "DOMException");
  }
  function isString(wat) {
    return isBuiltin(wat, "String");
  }
  function isParameterizedString(wat) {
    return typeof wat === "object" && wat !== null && "__sentry_template_string__" in wat && "__sentry_template_values__" in wat;
  }
  function isPrimitive(wat) {
    return wat === null || isParameterizedString(wat) || typeof wat !== "object" && typeof wat !== "function";
  }
  function isPlainObject(wat) {
    return isBuiltin(wat, "Object");
  }
  function isEvent(wat) {
    return typeof Event !== "undefined" && isInstanceOf(wat, Event);
  }
  function isElement(wat) {
    return typeof Element !== "undefined" && isInstanceOf(wat, Element);
  }
  function isRegExp(wat) {
    return isBuiltin(wat, "RegExp");
  }
  function isThenable(wat) {
    return Boolean(wat?.then && typeof wat.then === "function");
  }
  function isSyntheticEvent(wat) {
    return isPlainObject(wat) && "nativeEvent" in wat && "preventDefault" in wat && "stopPropagation" in wat;
  }
  function isInstanceOf(wat, base) {
    try {
      return wat instanceof base;
    } catch (_e) {
      return false;
    }
  }
  function isVueViewModel(wat) {
    return !!(typeof wat === "object" && wat !== null && (wat.__isVue || wat._isVue));
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/browser.js
  var WINDOW = GLOBAL_OBJ;
  var DEFAULT_MAX_STRING_LENGTH = 80;
  function htmlTreeAsString(elem, options = {}) {
    if (!elem) {
      return "<unknown>";
    }
    try {
      let currentElem = elem;
      const MAX_TRAVERSE_HEIGHT = 5;
      const out = [];
      let height = 0;
      let len = 0;
      const separator = " > ";
      const sepLength = separator.length;
      let nextStr;
      const keyAttrs = Array.isArray(options) ? options : options.keyAttrs;
      const maxStringLength = !Array.isArray(options) && options.maxStringLength || DEFAULT_MAX_STRING_LENGTH;
      while (currentElem && height++ < MAX_TRAVERSE_HEIGHT) {
        nextStr = _htmlElementAsString(currentElem, keyAttrs);
        if (nextStr === "html" || height > 1 && len + out.length * sepLength + nextStr.length >= maxStringLength) {
          break;
        }
        out.push(nextStr);
        len += nextStr.length;
        currentElem = currentElem.parentNode;
      }
      return out.reverse().join(separator);
    } catch (_oO) {
      return "<unknown>";
    }
  }
  function _htmlElementAsString(el, keyAttrs) {
    const elem = el;
    const out = [];
    if (!elem?.tagName) {
      return "";
    }
    if (WINDOW.HTMLElement) {
      if (elem instanceof HTMLElement && elem.dataset) {
        if (elem.dataset["sentryComponent"]) {
          return elem.dataset["sentryComponent"];
        }
        if (elem.dataset["sentryElement"]) {
          return elem.dataset["sentryElement"];
        }
      }
    }
    out.push(elem.tagName.toLowerCase());
    const keyAttrPairs = keyAttrs?.length ? keyAttrs.filter((keyAttr) => elem.getAttribute(keyAttr)).map((keyAttr) => [keyAttr, elem.getAttribute(keyAttr)]) : null;
    if (keyAttrPairs?.length) {
      keyAttrPairs.forEach((keyAttrPair) => {
        out.push(`[${keyAttrPair[0]}="${keyAttrPair[1]}"]`);
      });
    } else {
      if (elem.id) {
        out.push(`#${elem.id}`);
      }
      const className = elem.className;
      if (className && isString(className)) {
        const classes = className.split(/\s+/);
        for (const c of classes) {
          out.push(`.${c}`);
        }
      }
    }
    const allowedAttrs = ["aria-label", "type", "name", "title", "alt"];
    for (const k of allowedAttrs) {
      const attr = elem.getAttribute(k);
      if (attr) {
        out.push(`[${k}="${attr}"]`);
      }
    }
    return out.join("");
  }
  function getLocationHref() {
    try {
      return WINDOW.document.location.href;
    } catch (oO) {
      return "";
    }
  }
  function getComponentName(elem) {
    if (!WINDOW.HTMLElement) {
      return null;
    }
    let currentElem = elem;
    const MAX_TRAVERSE_HEIGHT = 5;
    for (let i = 0; i < MAX_TRAVERSE_HEIGHT; i++) {
      if (!currentElem) {
        return null;
      }
      if (currentElem instanceof HTMLElement) {
        if (currentElem.dataset["sentryComponent"]) {
          return currentElem.dataset["sentryComponent"];
        }
        if (currentElem.dataset["sentryElement"]) {
          return currentElem.dataset["sentryElement"];
        }
      }
      currentElem = currentElem.parentNode;
    }
    return null;
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/string.js
  function truncate(str, max = 0) {
    if (typeof str !== "string" || max === 0) {
      return str;
    }
    return str.length <= max ? str : `${str.slice(0, max)}...`;
  }
  function safeJoin(input, delimiter) {
    if (!Array.isArray(input)) {
      return "";
    }
    const output = [];
    for (let i = 0; i < input.length; i++) {
      const value = input[i];
      try {
        if (isVueViewModel(value)) {
          output.push("[VueViewModel]");
        } else {
          output.push(String(value));
        }
      } catch (e) {
        output.push("[value cannot be serialized]");
      }
    }
    return output.join(delimiter);
  }
  function isMatchingPattern(value, pattern, requireExactStringMatch = false) {
    if (!isString(value)) {
      return false;
    }
    if (isRegExp(pattern)) {
      return pattern.test(value);
    }
    if (isString(pattern)) {
      return requireExactStringMatch ? value === pattern : value.includes(pattern);
    }
    return false;
  }
  function stringMatchesSomePattern(testString, patterns = [], requireExactStringMatch = false) {
    return patterns.some((pattern) => isMatchingPattern(testString, pattern, requireExactStringMatch));
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/object.js
  function fill(source, name, replacementFactory) {
    if (!(name in source)) {
      return;
    }
    const original = source[name];
    const wrapped = replacementFactory(original);
    if (typeof wrapped === "function") {
      markFunctionWrapped(wrapped, original);
    }
    try {
      source[name] = wrapped;
    } catch {
      DEBUG_BUILD2 && logger.log(`Failed to replace method "${name}" in object`, source);
    }
  }
  function addNonEnumerableProperty(obj, name, value) {
    try {
      Object.defineProperty(obj, name, {
        // enumerable: false, // the default, so we can save on bundle size by not explicitly setting it
        value,
        writable: true,
        configurable: true
      });
    } catch (o_O) {
      DEBUG_BUILD2 && logger.log(`Failed to add non-enumerable property "${name}" to object`, obj);
    }
  }
  function markFunctionWrapped(wrapped, original) {
    try {
      const proto = original.prototype || {};
      wrapped.prototype = original.prototype = proto;
      addNonEnumerableProperty(wrapped, "__sentry_original__", original);
    } catch (o_O) {
    }
  }
  function getOriginalFunction(func) {
    return func.__sentry_original__;
  }
  function convertToPlainObject(value) {
    if (isError(value)) {
      return {
        message: value.message,
        name: value.name,
        stack: value.stack,
        ...getOwnProperties(value)
      };
    } else if (isEvent(value)) {
      const newObj = {
        type: value.type,
        target: serializeEventTarget(value.target),
        currentTarget: serializeEventTarget(value.currentTarget),
        ...getOwnProperties(value)
      };
      if (typeof CustomEvent !== "undefined" && isInstanceOf(value, CustomEvent)) {
        newObj.detail = value.detail;
      }
      return newObj;
    } else {
      return value;
    }
  }
  function serializeEventTarget(target) {
    try {
      return isElement(target) ? htmlTreeAsString(target) : Object.prototype.toString.call(target);
    } catch (_oO) {
      return "<unknown>";
    }
  }
  function getOwnProperties(obj) {
    if (typeof obj === "object" && obj !== null) {
      const extractedProps = {};
      for (const property in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, property)) {
          extractedProps[property] = obj[property];
        }
      }
      return extractedProps;
    } else {
      return {};
    }
  }
  function extractExceptionKeysForMessage(exception, maxLength = 40) {
    const keys = Object.keys(convertToPlainObject(exception));
    keys.sort();
    const firstKey = keys[0];
    if (!firstKey) {
      return "[object has no keys]";
    }
    if (firstKey.length >= maxLength) {
      return truncate(firstKey, maxLength);
    }
    for (let includedKeys = keys.length; includedKeys > 0; includedKeys--) {
      const serialized = keys.slice(0, includedKeys).join(", ");
      if (serialized.length > maxLength) {
        continue;
      }
      if (includedKeys === keys.length) {
        return serialized;
      }
      return truncate(serialized, maxLength);
    }
    return "";
  }
  function dropUndefinedKeys(inputValue) {
    const memoizationMap = /* @__PURE__ */ new Map();
    return _dropUndefinedKeys(inputValue, memoizationMap);
  }
  function _dropUndefinedKeys(inputValue, memoizationMap) {
    if (isPojo(inputValue)) {
      const memoVal = memoizationMap.get(inputValue);
      if (memoVal !== void 0) {
        return memoVal;
      }
      const returnValue = {};
      memoizationMap.set(inputValue, returnValue);
      for (const key of Object.getOwnPropertyNames(inputValue)) {
        if (typeof inputValue[key] !== "undefined") {
          returnValue[key] = _dropUndefinedKeys(inputValue[key], memoizationMap);
        }
      }
      return returnValue;
    }
    if (Array.isArray(inputValue)) {
      const memoVal = memoizationMap.get(inputValue);
      if (memoVal !== void 0) {
        return memoVal;
      }
      const returnValue = [];
      memoizationMap.set(inputValue, returnValue);
      inputValue.forEach((item) => {
        returnValue.push(_dropUndefinedKeys(item, memoizationMap));
      });
      return returnValue;
    }
    return inputValue;
  }
  function isPojo(input) {
    if (!isPlainObject(input)) {
      return false;
    }
    try {
      const name = Object.getPrototypeOf(input).constructor.name;
      return !name || name === "Object";
    } catch {
      return true;
    }
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/time.js
  var ONE_SECOND_IN_MS = 1e3;
  function dateTimestampInSeconds() {
    return Date.now() / ONE_SECOND_IN_MS;
  }
  function createUnixTimestampInSecondsFunc() {
    const { performance: performance2 } = GLOBAL_OBJ;
    if (!performance2?.now) {
      return dateTimestampInSeconds;
    }
    const approxStartingTimeOrigin = Date.now() - performance2.now();
    const timeOrigin = performance2.timeOrigin == void 0 ? approxStartingTimeOrigin : performance2.timeOrigin;
    return () => {
      return (timeOrigin + performance2.now()) / ONE_SECOND_IN_MS;
    };
  }
  var timestampInSeconds = createUnixTimestampInSecondsFunc();
  var cachedTimeOrigin;
  function getBrowserTimeOrigin() {
    const { performance: performance2 } = GLOBAL_OBJ;
    if (!performance2?.now) {
      return [void 0, "none"];
    }
    const threshold = 3600 * 1e3;
    const performanceNow = performance2.now();
    const dateNow = Date.now();
    const timeOriginDelta = performance2.timeOrigin ? Math.abs(performance2.timeOrigin + performanceNow - dateNow) : threshold;
    const timeOriginIsReliable = timeOriginDelta < threshold;
    const navigationStart = performance2.timing?.navigationStart;
    const hasNavigationStart = typeof navigationStart === "number";
    const navigationStartDelta = hasNavigationStart ? Math.abs(navigationStart + performanceNow - dateNow) : threshold;
    const navigationStartIsReliable = navigationStartDelta < threshold;
    if (timeOriginIsReliable || navigationStartIsReliable) {
      if (timeOriginDelta <= navigationStartDelta) {
        return [performance2.timeOrigin, "timeOrigin"];
      } else {
        return [navigationStart, "navigationStart"];
      }
    }
    return [dateNow, "dateNow"];
  }
  function browserPerformanceTimeOrigin() {
    if (!cachedTimeOrigin) {
      cachedTimeOrigin = getBrowserTimeOrigin();
    }
    return cachedTimeOrigin[0];
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/misc.js
  function uuid4() {
    const gbl = GLOBAL_OBJ;
    const crypto = gbl.crypto || gbl.msCrypto;
    let getRandomByte = () => Math.random() * 16;
    try {
      if (crypto?.randomUUID) {
        return crypto.randomUUID().replace(/-/g, "");
      }
      if (crypto?.getRandomValues) {
        getRandomByte = () => {
          const typedArray = new Uint8Array(1);
          crypto.getRandomValues(typedArray);
          return typedArray[0];
        };
      }
    } catch (_) {
    }
    return ("10000000100040008000" + 1e11).replace(
      /[018]/g,
      (c) => (
        // eslint-disable-next-line no-bitwise
        (c ^ (getRandomByte() & 15) >> c / 4).toString(16)
      )
    );
  }
  function getFirstException(event) {
    return event.exception?.values?.[0];
  }
  function getEventDescription(event) {
    const { message, event_id: eventId } = event;
    if (message) {
      return message;
    }
    const firstException = getFirstException(event);
    if (firstException) {
      if (firstException.type && firstException.value) {
        return `${firstException.type}: ${firstException.value}`;
      }
      return firstException.type || firstException.value || eventId || "<unknown>";
    }
    return eventId || "<unknown>";
  }
  function addExceptionTypeValue(event, value, type) {
    const exception = event.exception = event.exception || {};
    const values = exception.values = exception.values || [];
    const firstException = values[0] = values[0] || {};
    if (!firstException.value) {
      firstException.value = value || "";
    }
    if (!firstException.type) {
      firstException.type = type || "Error";
    }
  }
  function addExceptionMechanism(event, newMechanism) {
    const firstException = getFirstException(event);
    if (!firstException) {
      return;
    }
    const defaultMechanism = { type: "generic", handled: true };
    const currentMechanism = firstException.mechanism;
    firstException.mechanism = { ...defaultMechanism, ...currentMechanism, ...newMechanism };
    if (newMechanism && "data" in newMechanism) {
      const mergedData = { ...currentMechanism?.data, ...newMechanism.data };
      firstException.mechanism.data = mergedData;
    }
  }
  function checkOrSetAlreadyCaught(exception) {
    if (isAlreadyCaptured(exception)) {
      return true;
    }
    try {
      addNonEnumerableProperty(exception, "__sentry_captured__", true);
    } catch (err) {
    }
    return false;
  }
  function isAlreadyCaptured(exception) {
    try {
      return exception.__sentry_captured__;
    } catch {
    }
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/syncpromise.js
  var States;
  (function(States2) {
    const PENDING = 0;
    States2[States2["PENDING"] = PENDING] = "PENDING";
    const RESOLVED = 1;
    States2[States2["RESOLVED"] = RESOLVED] = "RESOLVED";
    const REJECTED = 2;
    States2[States2["REJECTED"] = REJECTED] = "REJECTED";
  })(States || (States = {}));
  function resolvedSyncPromise(value) {
    return new SyncPromise((resolve) => {
      resolve(value);
    });
  }
  function rejectedSyncPromise(reason) {
    return new SyncPromise((_, reject) => {
      reject(reason);
    });
  }
  var SyncPromise = class _SyncPromise {
    constructor(executor) {
      this._state = States.PENDING;
      this._handlers = [];
      this._runExecutor(executor);
    }
    /** @inheritdoc */
    then(onfulfilled, onrejected) {
      return new _SyncPromise((resolve, reject) => {
        this._handlers.push([
          false,
          (result) => {
            if (!onfulfilled) {
              resolve(result);
            } else {
              try {
                resolve(onfulfilled(result));
              } catch (e) {
                reject(e);
              }
            }
          },
          (reason) => {
            if (!onrejected) {
              reject(reason);
            } else {
              try {
                resolve(onrejected(reason));
              } catch (e) {
                reject(e);
              }
            }
          }
        ]);
        this._executeHandlers();
      });
    }
    /** @inheritdoc */
    catch(onrejected) {
      return this.then((val) => val, onrejected);
    }
    /** @inheritdoc */
    finally(onfinally) {
      return new _SyncPromise((resolve, reject) => {
        let val;
        let isRejected;
        return this.then(
          (value) => {
            isRejected = false;
            val = value;
            if (onfinally) {
              onfinally();
            }
          },
          (reason) => {
            isRejected = true;
            val = reason;
            if (onfinally) {
              onfinally();
            }
          }
        ).then(() => {
          if (isRejected) {
            reject(val);
            return;
          }
          resolve(val);
        });
      });
    }
    /** Excute the resolve/reject handlers. */
    _executeHandlers() {
      if (this._state === States.PENDING) {
        return;
      }
      const cachedHandlers = this._handlers.slice();
      this._handlers = [];
      cachedHandlers.forEach((handler) => {
        if (handler[0]) {
          return;
        }
        if (this._state === States.RESOLVED) {
          handler[1](this._value);
        }
        if (this._state === States.REJECTED) {
          handler[2](this._value);
        }
        handler[0] = true;
      });
    }
    /** Run the executor for the SyncPromise. */
    _runExecutor(executor) {
      const setResult = (state, value) => {
        if (this._state !== States.PENDING) {
          return;
        }
        if (isThenable(value)) {
          void value.then(resolve, reject);
          return;
        }
        this._state = state;
        this._value = value;
        this._executeHandlers();
      };
      const resolve = (value) => {
        setResult(States.RESOLVED, value);
      };
      const reject = (reason) => {
        setResult(States.REJECTED, reason);
      };
      try {
        executor(resolve, reject);
      } catch (e) {
        reject(e);
      }
    }
  };

  // ../../node_modules/@sentry/core/build/esm/session.js
  function makeSession(context) {
    const startingTime = timestampInSeconds();
    const session = {
      sid: uuid4(),
      init: true,
      timestamp: startingTime,
      started: startingTime,
      duration: 0,
      status: "ok",
      errors: 0,
      ignoreDuration: false,
      toJSON: () => sessionToJSON(session)
    };
    if (context) {
      updateSession(session, context);
    }
    return session;
  }
  function updateSession(session, context = {}) {
    if (context.user) {
      if (!session.ipAddress && context.user.ip_address) {
        session.ipAddress = context.user.ip_address;
      }
      if (!session.did && !context.did) {
        session.did = context.user.id || context.user.email || context.user.username;
      }
    }
    session.timestamp = context.timestamp || timestampInSeconds();
    if (context.abnormal_mechanism) {
      session.abnormal_mechanism = context.abnormal_mechanism;
    }
    if (context.ignoreDuration) {
      session.ignoreDuration = context.ignoreDuration;
    }
    if (context.sid) {
      session.sid = context.sid.length === 32 ? context.sid : uuid4();
    }
    if (context.init !== void 0) {
      session.init = context.init;
    }
    if (!session.did && context.did) {
      session.did = `${context.did}`;
    }
    if (typeof context.started === "number") {
      session.started = context.started;
    }
    if (session.ignoreDuration) {
      session.duration = void 0;
    } else if (typeof context.duration === "number") {
      session.duration = context.duration;
    } else {
      const duration = session.timestamp - session.started;
      session.duration = duration >= 0 ? duration : 0;
    }
    if (context.release) {
      session.release = context.release;
    }
    if (context.environment) {
      session.environment = context.environment;
    }
    if (!session.ipAddress && context.ipAddress) {
      session.ipAddress = context.ipAddress;
    }
    if (!session.userAgent && context.userAgent) {
      session.userAgent = context.userAgent;
    }
    if (typeof context.errors === "number") {
      session.errors = context.errors;
    }
    if (context.status) {
      session.status = context.status;
    }
  }
  function closeSession(session, status) {
    let context = {};
    if (status) {
      context = { status };
    } else if (session.status === "ok") {
      context = { status: "exited" };
    }
    updateSession(session, context);
  }
  function sessionToJSON(session) {
    return dropUndefinedKeys({
      sid: `${session.sid}`,
      init: session.init,
      // Make sure that sec is converted to ms for date constructor
      started: new Date(session.started * 1e3).toISOString(),
      timestamp: new Date(session.timestamp * 1e3).toISOString(),
      status: session.status,
      errors: session.errors,
      did: typeof session.did === "number" || typeof session.did === "string" ? `${session.did}` : void 0,
      duration: session.duration,
      abnormal_mechanism: session.abnormal_mechanism,
      attrs: {
        release: session.release,
        environment: session.environment,
        ip_address: session.ipAddress,
        user_agent: session.userAgent
      }
    });
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/propagationContext.js
  function generateTraceId() {
    return uuid4();
  }
  function generateSpanId() {
    return uuid4().substring(16);
  }

  // ../../node_modules/@sentry/core/build/esm/utils/merge.js
  function merge(initialObj, mergeObj, levels = 2) {
    if (!mergeObj || typeof mergeObj !== "object" || levels <= 0) {
      return mergeObj;
    }
    if (initialObj && Object.keys(mergeObj).length === 0) {
      return initialObj;
    }
    const output = { ...initialObj };
    for (const key in mergeObj) {
      if (Object.prototype.hasOwnProperty.call(mergeObj, key)) {
        output[key] = merge(output[key], mergeObj[key], levels - 1);
      }
    }
    return output;
  }

  // ../../node_modules/@sentry/core/build/esm/utils/spanOnScope.js
  var SCOPE_SPAN_FIELD = "_sentrySpan";
  function _setSpanForScope(scope, span) {
    if (span) {
      addNonEnumerableProperty(scope, SCOPE_SPAN_FIELD, span);
    } else {
      delete scope[SCOPE_SPAN_FIELD];
    }
  }
  function _getSpanForScope(scope) {
    return scope[SCOPE_SPAN_FIELD];
  }

  // ../../node_modules/@sentry/core/build/esm/scope.js
  var DEFAULT_MAX_BREADCRUMBS = 100;
  var Scope = class _Scope {
    /** Flag if notifying is happening. */
    /** Callback for client to receive scope changes. */
    /** Callback list that will be called during event processing. */
    /** Array of breadcrumbs. */
    /** User */
    /** Tags */
    /** Extra */
    /** Contexts */
    /** Attachments */
    /** Propagation Context for distributed tracing */
    /**
     * A place to stash data which is needed at some point in the SDK's event processing pipeline but which shouldn't get
     * sent to Sentry
     */
    /** Fingerprint */
    /** Severity */
    /**
     * Transaction Name
     *
     * IMPORTANT: The transaction name on the scope has nothing to do with root spans/transaction objects.
     * It's purpose is to assign a transaction to the scope that's added to non-transaction events.
     */
    /** Session */
    /** The client on this scope */
    /** Contains the last event id of a captured event.  */
    // NOTE: Any field which gets added here should get added not only to the constructor but also to the `clone` method.
    constructor() {
      this._notifyingListeners = false;
      this._scopeListeners = [];
      this._eventProcessors = [];
      this._breadcrumbs = [];
      this._attachments = [];
      this._user = {};
      this._tags = {};
      this._extra = {};
      this._contexts = {};
      this._sdkProcessingMetadata = {};
      this._propagationContext = {
        traceId: generateTraceId(),
        sampleRand: Math.random()
      };
    }
    /**
     * Clone all data from this scope into a new scope.
     */
    clone() {
      const newScope = new _Scope();
      newScope._breadcrumbs = [...this._breadcrumbs];
      newScope._tags = { ...this._tags };
      newScope._extra = { ...this._extra };
      newScope._contexts = { ...this._contexts };
      if (this._contexts.flags) {
        newScope._contexts.flags = {
          values: [...this._contexts.flags.values]
        };
      }
      newScope._user = this._user;
      newScope._level = this._level;
      newScope._session = this._session;
      newScope._transactionName = this._transactionName;
      newScope._fingerprint = this._fingerprint;
      newScope._eventProcessors = [...this._eventProcessors];
      newScope._attachments = [...this._attachments];
      newScope._sdkProcessingMetadata = { ...this._sdkProcessingMetadata };
      newScope._propagationContext = { ...this._propagationContext };
      newScope._client = this._client;
      newScope._lastEventId = this._lastEventId;
      _setSpanForScope(newScope, _getSpanForScope(this));
      return newScope;
    }
    /**
     * Update the client assigned to this scope.
     * Note that not every scope will have a client assigned - isolation scopes & the global scope will generally not have a client,
     * as well as manually created scopes.
     */
    setClient(client) {
      this._client = client;
    }
    /**
     * Set the ID of the last captured error event.
     * This is generally only captured on the isolation scope.
     */
    setLastEventId(lastEventId2) {
      this._lastEventId = lastEventId2;
    }
    /**
     * Get the client assigned to this scope.
     */
    getClient() {
      return this._client;
    }
    /**
     * Get the ID of the last captured error event.
     * This is generally only available on the isolation scope.
     */
    lastEventId() {
      return this._lastEventId;
    }
    /**
     * @inheritDoc
     */
    addScopeListener(callback) {
      this._scopeListeners.push(callback);
    }
    /**
     * Add an event processor that will be called before an event is sent.
     */
    addEventProcessor(callback) {
      this._eventProcessors.push(callback);
      return this;
    }
    /**
     * Set the user for this scope.
     * Set to `null` to unset the user.
     */
    setUser(user) {
      this._user = user || {
        email: void 0,
        id: void 0,
        ip_address: void 0,
        username: void 0
      };
      if (this._session) {
        updateSession(this._session, { user });
      }
      this._notifyScopeListeners();
      return this;
    }
    /**
     * Get the user from this scope.
     */
    getUser() {
      return this._user;
    }
    /**
     * Set an object that will be merged into existing tags on the scope,
     * and will be sent as tags data with the event.
     */
    setTags(tags) {
      this._tags = {
        ...this._tags,
        ...tags
      };
      this._notifyScopeListeners();
      return this;
    }
    /**
     * Set a single tag that will be sent as tags data with the event.
     */
    setTag(key, value) {
      this._tags = { ...this._tags, [key]: value };
      this._notifyScopeListeners();
      return this;
    }
    /**
     * Set an object that will be merged into existing extra on the scope,
     * and will be sent as extra data with the event.
     */
    setExtras(extras) {
      this._extra = {
        ...this._extra,
        ...extras
      };
      this._notifyScopeListeners();
      return this;
    }
    /**
     * Set a single key:value extra entry that will be sent as extra data with the event.
     */
    setExtra(key, extra) {
      this._extra = { ...this._extra, [key]: extra };
      this._notifyScopeListeners();
      return this;
    }
    /**
     * Sets the fingerprint on the scope to send with the events.
     * @param {string[]} fingerprint Fingerprint to group events in Sentry.
     */
    setFingerprint(fingerprint) {
      this._fingerprint = fingerprint;
      this._notifyScopeListeners();
      return this;
    }
    /**
     * Sets the level on the scope for future events.
     */
    setLevel(level) {
      this._level = level;
      this._notifyScopeListeners();
      return this;
    }
    /**
     * Sets the transaction name on the scope so that the name of e.g. taken server route or
     * the page location is attached to future events.
     *
     * IMPORTANT: Calling this function does NOT change the name of the currently active
     * root span. If you want to change the name of the active root span, use
     * `Sentry.updateSpanName(rootSpan, 'new name')` instead.
     *
     * By default, the SDK updates the scope's transaction name automatically on sensible
     * occasions, such as a page navigation or when handling a new request on the server.
     */
    setTransactionName(name) {
      this._transactionName = name;
      this._notifyScopeListeners();
      return this;
    }
    /**
     * Sets context data with the given name.
     * Data passed as context will be normalized. You can also pass `null` to unset the context.
     * Note that context data will not be merged - calling `setContext` will overwrite an existing context with the same key.
     */
    setContext(key, context) {
      if (context === null) {
        delete this._contexts[key];
      } else {
        this._contexts[key] = context;
      }
      this._notifyScopeListeners();
      return this;
    }
    /**
     * Set the session for the scope.
     */
    setSession(session) {
      if (!session) {
        delete this._session;
      } else {
        this._session = session;
      }
      this._notifyScopeListeners();
      return this;
    }
    /**
     * Get the session from the scope.
     */
    getSession() {
      return this._session;
    }
    /**
     * Updates the scope with provided data. Can work in three variations:
     * - plain object containing updatable attributes
     * - Scope instance that'll extract the attributes from
     * - callback function that'll receive the current scope as an argument and allow for modifications
     */
    update(captureContext) {
      if (!captureContext) {
        return this;
      }
      const scopeToMerge = typeof captureContext === "function" ? captureContext(this) : captureContext;
      const scopeInstance = scopeToMerge instanceof _Scope ? scopeToMerge.getScopeData() : isPlainObject(scopeToMerge) ? captureContext : void 0;
      const { tags, extra, user, contexts, level, fingerprint = [], propagationContext } = scopeInstance || {};
      this._tags = { ...this._tags, ...tags };
      this._extra = { ...this._extra, ...extra };
      this._contexts = { ...this._contexts, ...contexts };
      if (user && Object.keys(user).length) {
        this._user = user;
      }
      if (level) {
        this._level = level;
      }
      if (fingerprint.length) {
        this._fingerprint = fingerprint;
      }
      if (propagationContext) {
        this._propagationContext = propagationContext;
      }
      return this;
    }
    /**
     * Clears the current scope and resets its properties.
     * Note: The client will not be cleared.
     */
    clear() {
      this._breadcrumbs = [];
      this._tags = {};
      this._extra = {};
      this._user = {};
      this._contexts = {};
      this._level = void 0;
      this._transactionName = void 0;
      this._fingerprint = void 0;
      this._session = void 0;
      _setSpanForScope(this, void 0);
      this._attachments = [];
      this.setPropagationContext({ traceId: generateTraceId(), sampleRand: Math.random() });
      this._notifyScopeListeners();
      return this;
    }
    /**
     * Adds a breadcrumb to the scope.
     * By default, the last 100 breadcrumbs are kept.
     */
    addBreadcrumb(breadcrumb, maxBreadcrumbs) {
      const maxCrumbs = typeof maxBreadcrumbs === "number" ? maxBreadcrumbs : DEFAULT_MAX_BREADCRUMBS;
      if (maxCrumbs <= 0) {
        return this;
      }
      const mergedBreadcrumb = {
        timestamp: dateTimestampInSeconds(),
        ...breadcrumb
      };
      this._breadcrumbs.push(mergedBreadcrumb);
      if (this._breadcrumbs.length > maxCrumbs) {
        this._breadcrumbs = this._breadcrumbs.slice(-maxCrumbs);
        this._client?.recordDroppedEvent("buffer_overflow", "log_item");
      }
      this._notifyScopeListeners();
      return this;
    }
    /**
     * Get the last breadcrumb of the scope.
     */
    getLastBreadcrumb() {
      return this._breadcrumbs[this._breadcrumbs.length - 1];
    }
    /**
     * Clear all breadcrumbs from the scope.
     */
    clearBreadcrumbs() {
      this._breadcrumbs = [];
      this._notifyScopeListeners();
      return this;
    }
    /**
     * Add an attachment to the scope.
     */
    addAttachment(attachment) {
      this._attachments.push(attachment);
      return this;
    }
    /**
     * Clear all attachments from the scope.
     */
    clearAttachments() {
      this._attachments = [];
      return this;
    }
    /**
     * Get the data of this scope, which should be applied to an event during processing.
     */
    getScopeData() {
      return {
        breadcrumbs: this._breadcrumbs,
        attachments: this._attachments,
        contexts: this._contexts,
        tags: this._tags,
        extra: this._extra,
        user: this._user,
        level: this._level,
        fingerprint: this._fingerprint || [],
        eventProcessors: this._eventProcessors,
        propagationContext: this._propagationContext,
        sdkProcessingMetadata: this._sdkProcessingMetadata,
        transactionName: this._transactionName,
        span: _getSpanForScope(this)
      };
    }
    /**
     * Add data which will be accessible during event processing but won't get sent to Sentry.
     */
    setSDKProcessingMetadata(newData) {
      this._sdkProcessingMetadata = merge(this._sdkProcessingMetadata, newData, 2);
      return this;
    }
    /**
     * Add propagation context to the scope, used for distributed tracing
     */
    setPropagationContext(context) {
      this._propagationContext = context;
      return this;
    }
    /**
     * Get propagation context from the scope, used for distributed tracing
     */
    getPropagationContext() {
      return this._propagationContext;
    }
    /**
     * Capture an exception for this scope.
     *
     * @returns {string} The id of the captured Sentry event.
     */
    captureException(exception, hint) {
      const eventId = hint?.event_id || uuid4();
      if (!this._client) {
        logger.warn("No client configured on scope - will not capture exception!");
        return eventId;
      }
      const syntheticException = new Error("Sentry syntheticException");
      this._client.captureException(
        exception,
        {
          originalException: exception,
          syntheticException,
          ...hint,
          event_id: eventId
        },
        this
      );
      return eventId;
    }
    /**
     * Capture a message for this scope.
     *
     * @returns {string} The id of the captured message.
     */
    captureMessage(message, level, hint) {
      const eventId = hint?.event_id || uuid4();
      if (!this._client) {
        logger.warn("No client configured on scope - will not capture message!");
        return eventId;
      }
      const syntheticException = new Error(message);
      this._client.captureMessage(
        message,
        level,
        {
          originalException: message,
          syntheticException,
          ...hint,
          event_id: eventId
        },
        this
      );
      return eventId;
    }
    /**
     * Capture a Sentry event for this scope.
     *
     * @returns {string} The id of the captured event.
     */
    captureEvent(event, hint) {
      const eventId = hint?.event_id || uuid4();
      if (!this._client) {
        logger.warn("No client configured on scope - will not capture event!");
        return eventId;
      }
      this._client.captureEvent(event, { ...hint, event_id: eventId }, this);
      return eventId;
    }
    /**
     * This will be called on every set call.
     */
    _notifyScopeListeners() {
      if (!this._notifyingListeners) {
        this._notifyingListeners = true;
        this._scopeListeners.forEach((callback) => {
          callback(this);
        });
        this._notifyingListeners = false;
      }
    }
  };

  // ../../node_modules/@sentry/core/build/esm/defaultScopes.js
  function getDefaultCurrentScope() {
    return getGlobalSingleton("defaultCurrentScope", () => new Scope());
  }
  function getDefaultIsolationScope() {
    return getGlobalSingleton("defaultIsolationScope", () => new Scope());
  }

  // ../../node_modules/@sentry/core/build/esm/asyncContext/stackStrategy.js
  var AsyncContextStack = class {
    constructor(scope, isolationScope) {
      let assignedScope;
      if (!scope) {
        assignedScope = new Scope();
      } else {
        assignedScope = scope;
      }
      let assignedIsolationScope;
      if (!isolationScope) {
        assignedIsolationScope = new Scope();
      } else {
        assignedIsolationScope = isolationScope;
      }
      this._stack = [{ scope: assignedScope }];
      this._isolationScope = assignedIsolationScope;
    }
    /**
     * Fork a scope for the stack.
     */
    withScope(callback) {
      const scope = this._pushScope();
      let maybePromiseResult;
      try {
        maybePromiseResult = callback(scope);
      } catch (e) {
        this._popScope();
        throw e;
      }
      if (isThenable(maybePromiseResult)) {
        return maybePromiseResult.then(
          (res) => {
            this._popScope();
            return res;
          },
          (e) => {
            this._popScope();
            throw e;
          }
        );
      }
      this._popScope();
      return maybePromiseResult;
    }
    /**
     * Get the client of the stack.
     */
    getClient() {
      return this.getStackTop().client;
    }
    /**
     * Returns the scope of the top stack.
     */
    getScope() {
      return this.getStackTop().scope;
    }
    /**
     * Get the isolation scope for the stack.
     */
    getIsolationScope() {
      return this._isolationScope;
    }
    /**
     * Returns the topmost scope layer in the order domain > local > process.
     */
    getStackTop() {
      return this._stack[this._stack.length - 1];
    }
    /**
     * Push a scope to the stack.
     */
    _pushScope() {
      const scope = this.getScope().clone();
      this._stack.push({
        client: this.getClient(),
        scope
      });
      return scope;
    }
    /**
     * Pop a scope from the stack.
     */
    _popScope() {
      if (this._stack.length <= 1) return false;
      return !!this._stack.pop();
    }
  };
  function getAsyncContextStack() {
    const registry = getMainCarrier();
    const sentry = getSentryCarrier(registry);
    return sentry.stack = sentry.stack || new AsyncContextStack(getDefaultCurrentScope(), getDefaultIsolationScope());
  }
  function withScope(callback) {
    return getAsyncContextStack().withScope(callback);
  }
  function withSetScope(scope, callback) {
    const stack = getAsyncContextStack();
    return stack.withScope(() => {
      stack.getStackTop().scope = scope;
      return callback(scope);
    });
  }
  function withIsolationScope(callback) {
    return getAsyncContextStack().withScope(() => {
      return callback(getAsyncContextStack().getIsolationScope());
    });
  }
  function getStackAsyncContextStrategy() {
    return {
      withIsolationScope,
      withScope,
      withSetScope,
      withSetIsolationScope: (_isolationScope, callback) => {
        return withIsolationScope(callback);
      },
      getCurrentScope: () => getAsyncContextStack().getScope(),
      getIsolationScope: () => getAsyncContextStack().getIsolationScope()
    };
  }

  // ../../node_modules/@sentry/core/build/esm/asyncContext/index.js
  function getAsyncContextStrategy(carrier) {
    const sentry = getSentryCarrier(carrier);
    if (sentry.acs) {
      return sentry.acs;
    }
    return getStackAsyncContextStrategy();
  }

  // ../../node_modules/@sentry/core/build/esm/currentScopes.js
  function getCurrentScope() {
    const carrier = getMainCarrier();
    const acs = getAsyncContextStrategy(carrier);
    return acs.getCurrentScope();
  }
  function getIsolationScope() {
    const carrier = getMainCarrier();
    const acs = getAsyncContextStrategy(carrier);
    return acs.getIsolationScope();
  }
  function getGlobalScope() {
    return getGlobalSingleton("globalScope", () => new Scope());
  }
  function withScope2(...rest) {
    const carrier = getMainCarrier();
    const acs = getAsyncContextStrategy(carrier);
    if (rest.length === 2) {
      const [scope, callback] = rest;
      if (!scope) {
        return acs.withScope(callback);
      }
      return acs.withSetScope(scope, callback);
    }
    return acs.withScope(rest[0]);
  }
  function getClient() {
    return getCurrentScope().getClient();
  }
  function getTraceContextFromScope(scope) {
    const propagationContext = scope.getPropagationContext();
    const { traceId, parentSpanId, propagationSpanId } = propagationContext;
    const traceContext = dropUndefinedKeys({
      trace_id: traceId,
      span_id: propagationSpanId || generateSpanId(),
      parent_span_id: parentSpanId
    });
    return traceContext;
  }

  // ../../node_modules/@sentry/core/build/esm/semanticAttributes.js
  var SEMANTIC_ATTRIBUTE_SENTRY_SOURCE = "sentry.source";
  var SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE = "sentry.sample_rate";
  var SEMANTIC_ATTRIBUTE_SENTRY_OP = "sentry.op";
  var SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN = "sentry.origin";
  var SEMANTIC_ATTRIBUTE_SENTRY_IDLE_SPAN_FINISH_REASON = "sentry.idle_span_finish_reason";
  var SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT = "sentry.measurement_unit";
  var SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE = "sentry.measurement_value";
  var SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME = "sentry.custom_span_name";
  var SEMANTIC_ATTRIBUTE_PROFILE_ID = "sentry.profile_id";
  var SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME = "sentry.exclusive_time";

  // ../../node_modules/@sentry/core/build/esm/tracing/spanstatus.js
  var SPAN_STATUS_UNSET = 0;
  var SPAN_STATUS_OK = 1;
  var SPAN_STATUS_ERROR = 2;
  function getSpanStatusFromHttpCode(httpStatus) {
    if (httpStatus < 400 && httpStatus >= 100) {
      return { code: SPAN_STATUS_OK };
    }
    if (httpStatus >= 400 && httpStatus < 500) {
      switch (httpStatus) {
        case 401:
          return { code: SPAN_STATUS_ERROR, message: "unauthenticated" };
        case 403:
          return { code: SPAN_STATUS_ERROR, message: "permission_denied" };
        case 404:
          return { code: SPAN_STATUS_ERROR, message: "not_found" };
        case 409:
          return { code: SPAN_STATUS_ERROR, message: "already_exists" };
        case 413:
          return { code: SPAN_STATUS_ERROR, message: "failed_precondition" };
        case 429:
          return { code: SPAN_STATUS_ERROR, message: "resource_exhausted" };
        case 499:
          return { code: SPAN_STATUS_ERROR, message: "cancelled" };
        default:
          return { code: SPAN_STATUS_ERROR, message: "invalid_argument" };
      }
    }
    if (httpStatus >= 500 && httpStatus < 600) {
      switch (httpStatus) {
        case 501:
          return { code: SPAN_STATUS_ERROR, message: "unimplemented" };
        case 503:
          return { code: SPAN_STATUS_ERROR, message: "unavailable" };
        case 504:
          return { code: SPAN_STATUS_ERROR, message: "deadline_exceeded" };
        default:
          return { code: SPAN_STATUS_ERROR, message: "internal_error" };
      }
    }
    return { code: SPAN_STATUS_ERROR, message: "unknown_error" };
  }
  function setHttpStatus(span, httpStatus) {
    span.setAttribute("http.response.status_code", httpStatus);
    const spanStatus = getSpanStatusFromHttpCode(httpStatus);
    if (spanStatus.message !== "unknown_error") {
      span.setStatus(spanStatus);
    }
  }

  // ../../node_modules/@sentry/core/build/esm/tracing/utils.js
  var SCOPE_ON_START_SPAN_FIELD = "_sentryScope";
  var ISOLATION_SCOPE_ON_START_SPAN_FIELD = "_sentryIsolationScope";
  function setCapturedScopesOnSpan(span, scope, isolationScope) {
    if (span) {
      addNonEnumerableProperty(span, ISOLATION_SCOPE_ON_START_SPAN_FIELD, isolationScope);
      addNonEnumerableProperty(span, SCOPE_ON_START_SPAN_FIELD, scope);
    }
  }
  function getCapturedScopesOnSpan(span) {
    return {
      scope: span[SCOPE_ON_START_SPAN_FIELD],
      isolationScope: span[ISOLATION_SCOPE_ON_START_SPAN_FIELD]
    };
  }

  // ../../node_modules/@sentry/core/build/esm/utils/parseSampleRate.js
  function parseSampleRate(sampleRate) {
    if (typeof sampleRate === "boolean") {
      return Number(sampleRate);
    }
    const rate = typeof sampleRate === "string" ? parseFloat(sampleRate) : sampleRate;
    if (typeof rate !== "number" || isNaN(rate) || rate < 0 || rate > 1) {
      return void 0;
    }
    return rate;
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/baggage.js
  var SENTRY_BAGGAGE_KEY_PREFIX = "sentry-";
  var SENTRY_BAGGAGE_KEY_PREFIX_REGEX = /^sentry-/;
  var MAX_BAGGAGE_STRING_LENGTH = 8192;
  function baggageHeaderToDynamicSamplingContext(baggageHeader) {
    const baggageObject = parseBaggageHeader(baggageHeader);
    if (!baggageObject) {
      return void 0;
    }
    const dynamicSamplingContext = Object.entries(baggageObject).reduce((acc, [key, value]) => {
      if (key.match(SENTRY_BAGGAGE_KEY_PREFIX_REGEX)) {
        const nonPrefixedKey = key.slice(SENTRY_BAGGAGE_KEY_PREFIX.length);
        acc[nonPrefixedKey] = value;
      }
      return acc;
    }, {});
    if (Object.keys(dynamicSamplingContext).length > 0) {
      return dynamicSamplingContext;
    } else {
      return void 0;
    }
  }
  function dynamicSamplingContextToSentryBaggageHeader(dynamicSamplingContext) {
    if (!dynamicSamplingContext) {
      return void 0;
    }
    const sentryPrefixedDSC = Object.entries(dynamicSamplingContext).reduce(
      (acc, [dscKey, dscValue]) => {
        if (dscValue) {
          acc[`${SENTRY_BAGGAGE_KEY_PREFIX}${dscKey}`] = dscValue;
        }
        return acc;
      },
      {}
    );
    return objectToBaggageHeader(sentryPrefixedDSC);
  }
  function parseBaggageHeader(baggageHeader) {
    if (!baggageHeader || !isString(baggageHeader) && !Array.isArray(baggageHeader)) {
      return void 0;
    }
    if (Array.isArray(baggageHeader)) {
      return baggageHeader.reduce((acc, curr) => {
        const currBaggageObject = baggageHeaderToObject(curr);
        Object.entries(currBaggageObject).forEach(([key, value]) => {
          acc[key] = value;
        });
        return acc;
      }, {});
    }
    return baggageHeaderToObject(baggageHeader);
  }
  function baggageHeaderToObject(baggageHeader) {
    return baggageHeader.split(",").map((baggageEntry) => baggageEntry.split("=").map((keyOrValue) => decodeURIComponent(keyOrValue.trim()))).reduce((acc, [key, value]) => {
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }
  function objectToBaggageHeader(object) {
    if (Object.keys(object).length === 0) {
      return void 0;
    }
    return Object.entries(object).reduce((baggageHeader, [objectKey, objectValue], currentIndex) => {
      const baggageEntry = `${encodeURIComponent(objectKey)}=${encodeURIComponent(objectValue)}`;
      const newBaggageHeader = currentIndex === 0 ? baggageEntry : `${baggageHeader},${baggageEntry}`;
      if (newBaggageHeader.length > MAX_BAGGAGE_STRING_LENGTH) {
        DEBUG_BUILD2 && logger.warn(
          `Not adding key: ${objectKey} with val: ${objectValue} to baggage header due to exceeding baggage size limits.`
        );
        return baggageHeader;
      } else {
        return newBaggageHeader;
      }
    }, "");
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/tracing.js
  var TRACEPARENT_REGEXP = new RegExp(
    "^[ \\t]*([0-9a-f]{32})?-?([0-9a-f]{16})?-?([01])?[ \\t]*$"
    // whitespace
  );
  function extractTraceparentData(traceparent) {
    if (!traceparent) {
      return void 0;
    }
    const matches = traceparent.match(TRACEPARENT_REGEXP);
    if (!matches) {
      return void 0;
    }
    let parentSampled;
    if (matches[3] === "1") {
      parentSampled = true;
    } else if (matches[3] === "0") {
      parentSampled = false;
    }
    return {
      traceId: matches[1],
      parentSampled,
      parentSpanId: matches[2]
    };
  }
  function propagationContextFromHeaders(sentryTrace, baggage) {
    const traceparentData = extractTraceparentData(sentryTrace);
    const dynamicSamplingContext = baggageHeaderToDynamicSamplingContext(baggage);
    if (!traceparentData?.traceId) {
      return {
        traceId: generateTraceId(),
        sampleRand: Math.random()
      };
    }
    const sampleRand = getSampleRandFromTraceparentAndDsc(traceparentData, dynamicSamplingContext);
    if (dynamicSamplingContext) {
      dynamicSamplingContext.sample_rand = sampleRand.toString();
    }
    const { traceId, parentSpanId, parentSampled } = traceparentData;
    return {
      traceId,
      parentSpanId,
      sampled: parentSampled,
      dsc: dynamicSamplingContext || {},
      // If we have traceparent data but no DSC it means we are not head of trace and we must freeze it
      sampleRand
    };
  }
  function generateSentryTraceHeader(traceId = generateTraceId(), spanId = generateSpanId(), sampled) {
    let sampledString = "";
    if (sampled !== void 0) {
      sampledString = sampled ? "-1" : "-0";
    }
    return `${traceId}-${spanId}${sampledString}`;
  }
  function getSampleRandFromTraceparentAndDsc(traceparentData, dsc) {
    const parsedSampleRand = parseSampleRate(dsc?.sample_rand);
    if (parsedSampleRand !== void 0) {
      return parsedSampleRand;
    }
    const parsedSampleRate = parseSampleRate(dsc?.sample_rate);
    if (parsedSampleRate && traceparentData?.parentSampled !== void 0) {
      return traceparentData.parentSampled ? (
        // Returns a sample rand with positive sampling decision [0, sampleRate)
        Math.random() * parsedSampleRate
      ) : (
        // Returns a sample rand with negative sampling decision [sampleRate, 1)
        parsedSampleRate + Math.random() * (1 - parsedSampleRate)
      );
    } else {
      return Math.random();
    }
  }

  // ../../node_modules/@sentry/core/build/esm/utils/spanUtils.js
  var TRACE_FLAG_NONE = 0;
  var TRACE_FLAG_SAMPLED = 1;
  var hasShownSpanDropWarning = false;
  function spanToTransactionTraceContext(span) {
    const { spanId: span_id, traceId: trace_id } = span.spanContext();
    const { data, op, parent_span_id, status, origin, links } = spanToJSON(span);
    return dropUndefinedKeys({
      parent_span_id,
      span_id,
      trace_id,
      data,
      op,
      status,
      origin,
      links
    });
  }
  function spanToTraceContext(span) {
    const { spanId, traceId: trace_id, isRemote } = span.spanContext();
    const parent_span_id = isRemote ? spanId : spanToJSON(span).parent_span_id;
    const scope = getCapturedScopesOnSpan(span).scope;
    const span_id = isRemote ? scope?.getPropagationContext().propagationSpanId || generateSpanId() : spanId;
    return dropUndefinedKeys({
      parent_span_id,
      span_id,
      trace_id
    });
  }
  function spanToTraceHeader(span) {
    const { traceId, spanId } = span.spanContext();
    const sampled = spanIsSampled(span);
    return generateSentryTraceHeader(traceId, spanId, sampled);
  }
  function convertSpanLinksForEnvelope(links) {
    if (links && links.length > 0) {
      return links.map(({ context: { spanId, traceId, traceFlags, ...restContext }, attributes }) => ({
        span_id: spanId,
        trace_id: traceId,
        sampled: traceFlags === TRACE_FLAG_SAMPLED,
        attributes,
        ...restContext
      }));
    } else {
      return void 0;
    }
  }
  function spanTimeInputToSeconds(input) {
    if (typeof input === "number") {
      return ensureTimestampInSeconds(input);
    }
    if (Array.isArray(input)) {
      return input[0] + input[1] / 1e9;
    }
    if (input instanceof Date) {
      return ensureTimestampInSeconds(input.getTime());
    }
    return timestampInSeconds();
  }
  function ensureTimestampInSeconds(timestamp) {
    const isMs = timestamp > 9999999999;
    return isMs ? timestamp / 1e3 : timestamp;
  }
  function spanToJSON(span) {
    if (spanIsSentrySpan(span)) {
      return span.getSpanJSON();
    }
    const { spanId: span_id, traceId: trace_id } = span.spanContext();
    if (spanIsOpenTelemetrySdkTraceBaseSpan(span)) {
      const { attributes, startTime, name, endTime, parentSpanId, status, links } = span;
      return dropUndefinedKeys({
        span_id,
        trace_id,
        data: attributes,
        description: name,
        parent_span_id: parentSpanId,
        start_timestamp: spanTimeInputToSeconds(startTime),
        // This is [0,0] by default in OTEL, in which case we want to interpret this as no end time
        timestamp: spanTimeInputToSeconds(endTime) || void 0,
        status: getStatusMessage(status),
        op: attributes[SEMANTIC_ATTRIBUTE_SENTRY_OP],
        origin: attributes[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN],
        links: convertSpanLinksForEnvelope(links)
      });
    }
    return {
      span_id,
      trace_id,
      start_timestamp: 0,
      data: {}
    };
  }
  function spanIsOpenTelemetrySdkTraceBaseSpan(span) {
    const castSpan = span;
    return !!castSpan.attributes && !!castSpan.startTime && !!castSpan.name && !!castSpan.endTime && !!castSpan.status;
  }
  function spanIsSentrySpan(span) {
    return typeof span.getSpanJSON === "function";
  }
  function spanIsSampled(span) {
    const { traceFlags } = span.spanContext();
    return traceFlags === TRACE_FLAG_SAMPLED;
  }
  function getStatusMessage(status) {
    if (!status || status.code === SPAN_STATUS_UNSET) {
      return void 0;
    }
    if (status.code === SPAN_STATUS_OK) {
      return "ok";
    }
    return status.message || "unknown_error";
  }
  var CHILD_SPANS_FIELD = "_sentryChildSpans";
  var ROOT_SPAN_FIELD = "_sentryRootSpan";
  function addChildSpanToSpan(span, childSpan) {
    const rootSpan = span[ROOT_SPAN_FIELD] || span;
    addNonEnumerableProperty(childSpan, ROOT_SPAN_FIELD, rootSpan);
    if (span[CHILD_SPANS_FIELD]) {
      span[CHILD_SPANS_FIELD].add(childSpan);
    } else {
      addNonEnumerableProperty(span, CHILD_SPANS_FIELD, /* @__PURE__ */ new Set([childSpan]));
    }
  }
  function removeChildSpanFromSpan(span, childSpan) {
    if (span[CHILD_SPANS_FIELD]) {
      span[CHILD_SPANS_FIELD].delete(childSpan);
    }
  }
  function getSpanDescendants(span) {
    const resultSet = /* @__PURE__ */ new Set();
    function addSpanChildren(span2) {
      if (resultSet.has(span2)) {
        return;
      } else if (spanIsSampled(span2)) {
        resultSet.add(span2);
        const childSpans = span2[CHILD_SPANS_FIELD] ? Array.from(span2[CHILD_SPANS_FIELD]) : [];
        for (const childSpan of childSpans) {
          addSpanChildren(childSpan);
        }
      }
    }
    addSpanChildren(span);
    return Array.from(resultSet);
  }
  function getRootSpan(span) {
    return span[ROOT_SPAN_FIELD] || span;
  }
  function getActiveSpan() {
    const carrier = getMainCarrier();
    const acs = getAsyncContextStrategy(carrier);
    if (acs.getActiveSpan) {
      return acs.getActiveSpan();
    }
    return _getSpanForScope(getCurrentScope());
  }
  function showSpanDropWarning() {
    if (!hasShownSpanDropWarning) {
      consoleSandbox(() => {
        console.warn(
          "[Sentry] Returning null from `beforeSendSpan` is disallowed. To drop certain spans, configure the respective integrations directly."
        );
      });
      hasShownSpanDropWarning = true;
    }
  }

  // ../../node_modules/@sentry/core/build/esm/tracing/errors.js
  var errorsInstrumented = false;
  function registerSpanErrorInstrumentation() {
    if (errorsInstrumented) {
      return;
    }
    errorsInstrumented = true;
    addGlobalErrorInstrumentationHandler(errorCallback);
    addGlobalUnhandledRejectionInstrumentationHandler(errorCallback);
  }
  function errorCallback() {
    const activeSpan = getActiveSpan();
    const rootSpan = activeSpan && getRootSpan(activeSpan);
    if (rootSpan) {
      const message = "internal_error";
      DEBUG_BUILD && logger.log(`[Tracing] Root span: ${message} -> Global error occurred`);
      rootSpan.setStatus({ code: SPAN_STATUS_ERROR, message });
    }
  }
  errorCallback.tag = "sentry_tracingErrorCallback";

  // ../../node_modules/@sentry/core/build/esm/utils/hasSpansEnabled.js
  function hasSpansEnabled(maybeOptions) {
    if (typeof __SENTRY_TRACING__ === "boolean" && !__SENTRY_TRACING__) {
      return false;
    }
    const options = maybeOptions || getClient()?.getOptions();
    return !!options && // Note: This check is `!= null`, meaning "nullish". `0` is not "nullish", `undefined` and `null` are. (This comment was brought to you by 15 minutes of questioning life)
    (options.tracesSampleRate != null || !!options.tracesSampler);
  }

  // ../../node_modules/@sentry/core/build/esm/constants.js
  var DEFAULT_ENVIRONMENT = "production";

  // ../../node_modules/@sentry/core/build/esm/tracing/dynamicSamplingContext.js
  var FROZEN_DSC_FIELD = "_frozenDsc";
  function freezeDscOnSpan(span, dsc) {
    const spanWithMaybeDsc = span;
    addNonEnumerableProperty(spanWithMaybeDsc, FROZEN_DSC_FIELD, dsc);
  }
  function getDynamicSamplingContextFromClient(trace_id, client) {
    const options = client.getOptions();
    const { publicKey: public_key } = client.getDsn() || {};
    const dsc = dropUndefinedKeys({
      environment: options.environment || DEFAULT_ENVIRONMENT,
      release: options.release,
      public_key,
      trace_id
    });
    client.emit("createDsc", dsc);
    return dsc;
  }
  function getDynamicSamplingContextFromScope(client, scope) {
    const propagationContext = scope.getPropagationContext();
    return propagationContext.dsc || getDynamicSamplingContextFromClient(propagationContext.traceId, client);
  }
  function getDynamicSamplingContextFromSpan(span) {
    const client = getClient();
    if (!client) {
      return {};
    }
    const rootSpan = getRootSpan(span);
    const rootSpanJson = spanToJSON(rootSpan);
    const rootSpanAttributes = rootSpanJson.data;
    const traceState = rootSpan.spanContext().traceState;
    const rootSpanSampleRate = traceState?.get("sentry.sample_rate") ?? rootSpanAttributes[SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE];
    function applyLocalSampleRateToDsc(dsc2) {
      if (typeof rootSpanSampleRate === "number" || typeof rootSpanSampleRate === "string") {
        dsc2.sample_rate = `${rootSpanSampleRate}`;
      }
      return dsc2;
    }
    const frozenDsc = rootSpan[FROZEN_DSC_FIELD];
    if (frozenDsc) {
      return applyLocalSampleRateToDsc(frozenDsc);
    }
    const traceStateDsc = traceState?.get("sentry.dsc");
    const dscOnTraceState = traceStateDsc && baggageHeaderToDynamicSamplingContext(traceStateDsc);
    if (dscOnTraceState) {
      return applyLocalSampleRateToDsc(dscOnTraceState);
    }
    const dsc = getDynamicSamplingContextFromClient(span.spanContext().traceId, client);
    const source = rootSpanAttributes[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE];
    const name = rootSpanJson.description;
    if (source !== "url" && name) {
      dsc.transaction = name;
    }
    if (hasSpansEnabled()) {
      dsc.sampled = String(spanIsSampled(rootSpan));
      dsc.sample_rand = // In OTEL we store the sample rand on the trace state because we cannot access scopes for NonRecordingSpans
      // The Sentry OTEL SpanSampler takes care of writing the sample rand on the root span
      traceState?.get("sentry.sample_rand") ?? // On all other platforms we can actually get the scopes from a root span (we use this as a fallback)
      getCapturedScopesOnSpan(rootSpan).scope?.getPropagationContext().sampleRand.toString();
    }
    applyLocalSampleRateToDsc(dsc);
    client.emit("createDsc", dsc, rootSpan);
    return dsc;
  }

  // ../../node_modules/@sentry/core/build/esm/tracing/sentryNonRecordingSpan.js
  var SentryNonRecordingSpan = class {
    constructor(spanContext = {}) {
      this._traceId = spanContext.traceId || generateTraceId();
      this._spanId = spanContext.spanId || generateSpanId();
    }
    /** @inheritdoc */
    spanContext() {
      return {
        spanId: this._spanId,
        traceId: this._traceId,
        traceFlags: TRACE_FLAG_NONE
      };
    }
    /** @inheritdoc */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    end(_timestamp) {
    }
    /** @inheritdoc */
    setAttribute(_key, _value) {
      return this;
    }
    /** @inheritdoc */
    setAttributes(_values) {
      return this;
    }
    /** @inheritdoc */
    setStatus(_status) {
      return this;
    }
    /** @inheritdoc */
    updateName(_name) {
      return this;
    }
    /** @inheritdoc */
    isRecording() {
      return false;
    }
    /** @inheritdoc */
    addEvent(_name, _attributesOrStartTime, _startTime) {
      return this;
    }
    /** @inheritDoc */
    addLink(_link) {
      return this;
    }
    /** @inheritDoc */
    addLinks(_links) {
      return this;
    }
    /**
     * This should generally not be used,
     * but we need it for being compliant with the OTEL Span interface.
     *
     * @hidden
     * @internal
     */
    recordException(_exception, _time) {
    }
  };

  // ../../node_modules/@sentry/core/build/esm/tracing/logSpans.js
  function logSpanStart(span) {
    if (!DEBUG_BUILD) return;
    const { description = "< unknown name >", op = "< unknown op >", parent_span_id: parentSpanId } = spanToJSON(span);
    const { spanId } = span.spanContext();
    const sampled = spanIsSampled(span);
    const rootSpan = getRootSpan(span);
    const isRootSpan = rootSpan === span;
    const header = `[Tracing] Starting ${sampled ? "sampled" : "unsampled"} ${isRootSpan ? "root " : ""}span`;
    const infoParts = [`op: ${op}`, `name: ${description}`, `ID: ${spanId}`];
    if (parentSpanId) {
      infoParts.push(`parent ID: ${parentSpanId}`);
    }
    if (!isRootSpan) {
      const { op: op2, description: description2 } = spanToJSON(rootSpan);
      infoParts.push(`root ID: ${rootSpan.spanContext().spanId}`);
      if (op2) {
        infoParts.push(`root op: ${op2}`);
      }
      if (description2) {
        infoParts.push(`root description: ${description2}`);
      }
    }
    logger.log(`${header}
  ${infoParts.join("\n  ")}`);
  }
  function logSpanEnd(span) {
    if (!DEBUG_BUILD) return;
    const { description = "< unknown name >", op = "< unknown op >" } = spanToJSON(span);
    const { spanId } = span.spanContext();
    const rootSpan = getRootSpan(span);
    const isRootSpan = rootSpan === span;
    const msg = `[Tracing] Finishing "${op}" ${isRootSpan ? "root " : ""}span "${description}" with ID ${spanId}`;
    logger.log(msg);
  }

  // ../../node_modules/@sentry/core/build/esm/tracing/sampling.js
  function sampleSpan(options, samplingContext, sampleRand) {
    if (!hasSpansEnabled(options)) {
      return [false];
    }
    let localSampleRateWasApplied = void 0;
    let sampleRate;
    if (typeof options.tracesSampler === "function") {
      sampleRate = options.tracesSampler({
        ...samplingContext,
        inheritOrSampleWith: (fallbackSampleRate) => {
          if (typeof samplingContext.parentSampleRate === "number") {
            return samplingContext.parentSampleRate;
          }
          if (typeof samplingContext.parentSampled === "boolean") {
            return Number(samplingContext.parentSampled);
          }
          return fallbackSampleRate;
        }
      });
      localSampleRateWasApplied = true;
    } else if (samplingContext.parentSampled !== void 0) {
      sampleRate = samplingContext.parentSampled;
    } else if (typeof options.tracesSampleRate !== "undefined") {
      sampleRate = options.tracesSampleRate;
      localSampleRateWasApplied = true;
    }
    const parsedSampleRate = parseSampleRate(sampleRate);
    if (parsedSampleRate === void 0) {
      DEBUG_BUILD && logger.warn(
        `[Tracing] Discarding root span because of invalid sample rate. Sample rate must be a boolean or a number between 0 and 1. Got ${JSON.stringify(
          sampleRate
        )} of type ${JSON.stringify(typeof sampleRate)}.`
      );
      return [false];
    }
    if (!parsedSampleRate) {
      DEBUG_BUILD && logger.log(
        `[Tracing] Discarding transaction because ${typeof options.tracesSampler === "function" ? "tracesSampler returned 0 or false" : "a negative sampling decision was inherited or tracesSampleRate is set to 0"}`
      );
      return [false, parsedSampleRate, localSampleRateWasApplied];
    }
    const shouldSample = sampleRand < parsedSampleRate;
    if (!shouldSample) {
      DEBUG_BUILD && logger.log(
        `[Tracing] Discarding transaction because it's not included in the random sample (sampling rate = ${Number(
          sampleRate
        )})`
      );
    }
    return [shouldSample, parsedSampleRate, localSampleRateWasApplied];
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/dsn.js
  var DSN_REGEX = /^(?:(\w+):)\/\/(?:(\w+)(?::(\w+)?)?@)([\w.-]+)(?::(\d+))?\/(.+)/;
  function isValidProtocol(protocol) {
    return protocol === "http" || protocol === "https";
  }
  function dsnToString(dsn, withPassword = false) {
    const { host, path, pass, port, projectId, protocol, publicKey } = dsn;
    return `${protocol}://${publicKey}${withPassword && pass ? `:${pass}` : ""}@${host}${port ? `:${port}` : ""}/${path ? `${path}/` : path}${projectId}`;
  }
  function dsnFromString(str) {
    const match = DSN_REGEX.exec(str);
    if (!match) {
      consoleSandbox(() => {
        console.error(`Invalid Sentry Dsn: ${str}`);
      });
      return void 0;
    }
    const [protocol, publicKey, pass = "", host = "", port = "", lastPath = ""] = match.slice(1);
    let path = "";
    let projectId = lastPath;
    const split = projectId.split("/");
    if (split.length > 1) {
      path = split.slice(0, -1).join("/");
      projectId = split.pop();
    }
    if (projectId) {
      const projectMatch = projectId.match(/^\d+/);
      if (projectMatch) {
        projectId = projectMatch[0];
      }
    }
    return dsnFromComponents({ host, pass, path, projectId, port, protocol, publicKey });
  }
  function dsnFromComponents(components) {
    return {
      protocol: components.protocol,
      publicKey: components.publicKey || "",
      pass: components.pass || "",
      host: components.host,
      port: components.port || "",
      path: components.path || "",
      projectId: components.projectId
    };
  }
  function validateDsn(dsn) {
    if (!DEBUG_BUILD2) {
      return true;
    }
    const { port, projectId, protocol } = dsn;
    const requiredComponents = ["protocol", "publicKey", "host", "projectId"];
    const hasMissingRequiredComponent = requiredComponents.find((component) => {
      if (!dsn[component]) {
        logger.error(`Invalid Sentry Dsn: ${component} missing`);
        return true;
      }
      return false;
    });
    if (hasMissingRequiredComponent) {
      return false;
    }
    if (!projectId.match(/^\d+$/)) {
      logger.error(`Invalid Sentry Dsn: Invalid projectId ${projectId}`);
      return false;
    }
    if (!isValidProtocol(protocol)) {
      logger.error(`Invalid Sentry Dsn: Invalid protocol ${protocol}`);
      return false;
    }
    if (port && isNaN(parseInt(port, 10))) {
      logger.error(`Invalid Sentry Dsn: Invalid port ${port}`);
      return false;
    }
    return true;
  }
  function makeDsn(from) {
    const components = typeof from === "string" ? dsnFromString(from) : dsnFromComponents(from);
    if (!components || !validateDsn(components)) {
      return void 0;
    }
    return components;
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/normalize.js
  function normalize(input, depth = 100, maxProperties = Infinity) {
    try {
      return visit("", input, depth, maxProperties);
    } catch (err) {
      return { ERROR: `**non-serializable** (${err})` };
    }
  }
  function normalizeToSize(object, depth = 3, maxSize = 100 * 1024) {
    const normalized = normalize(object, depth);
    if (jsonSize(normalized) > maxSize) {
      return normalizeToSize(object, depth - 1, maxSize);
    }
    return normalized;
  }
  function visit(key, value, depth = Infinity, maxProperties = Infinity, memo = memoBuilder()) {
    const [memoize, unmemoize] = memo;
    if (value == null || // this matches null and undefined -> eqeq not eqeqeq
    ["boolean", "string"].includes(typeof value) || typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    const stringified = stringifyValue(key, value);
    if (!stringified.startsWith("[object ")) {
      return stringified;
    }
    if (value["__sentry_skip_normalization__"]) {
      return value;
    }
    const remainingDepth = typeof value["__sentry_override_normalization_depth__"] === "number" ? value["__sentry_override_normalization_depth__"] : depth;
    if (remainingDepth === 0) {
      return stringified.replace("object ", "");
    }
    if (memoize(value)) {
      return "[Circular ~]";
    }
    const valueWithToJSON = value;
    if (valueWithToJSON && typeof valueWithToJSON.toJSON === "function") {
      try {
        const jsonValue = valueWithToJSON.toJSON();
        return visit("", jsonValue, remainingDepth - 1, maxProperties, memo);
      } catch (err) {
      }
    }
    const normalized = Array.isArray(value) ? [] : {};
    let numAdded = 0;
    const visitable = convertToPlainObject(value);
    for (const visitKey in visitable) {
      if (!Object.prototype.hasOwnProperty.call(visitable, visitKey)) {
        continue;
      }
      if (numAdded >= maxProperties) {
        normalized[visitKey] = "[MaxProperties ~]";
        break;
      }
      const visitValue = visitable[visitKey];
      normalized[visitKey] = visit(visitKey, visitValue, remainingDepth - 1, maxProperties, memo);
      numAdded++;
    }
    unmemoize(value);
    return normalized;
  }
  function stringifyValue(key, value) {
    try {
      if (key === "domain" && value && typeof value === "object" && value._events) {
        return "[Domain]";
      }
      if (key === "domainEmitter") {
        return "[DomainEmitter]";
      }
      if (typeof global !== "undefined" && value === global) {
        return "[Global]";
      }
      if (typeof window !== "undefined" && value === window) {
        return "[Window]";
      }
      if (typeof document !== "undefined" && value === document) {
        return "[Document]";
      }
      if (isVueViewModel(value)) {
        return "[VueViewModel]";
      }
      if (isSyntheticEvent(value)) {
        return "[SyntheticEvent]";
      }
      if (typeof value === "number" && !Number.isFinite(value)) {
        return `[${value}]`;
      }
      if (typeof value === "function") {
        return `[Function: ${getFunctionName(value)}]`;
      }
      if (typeof value === "symbol") {
        return `[${String(value)}]`;
      }
      if (typeof value === "bigint") {
        return `[BigInt: ${String(value)}]`;
      }
      const objName = getConstructorName(value);
      if (/^HTML(\w*)Element$/.test(objName)) {
        return `[HTMLElement: ${objName}]`;
      }
      return `[object ${objName}]`;
    } catch (err) {
      return `**non-serializable** (${err})`;
    }
  }
  function getConstructorName(value) {
    const prototype = Object.getPrototypeOf(value);
    return prototype ? prototype.constructor.name : "null prototype";
  }
  function utf8Length(value) {
    return ~-encodeURI(value).split(/%..|./).length;
  }
  function jsonSize(value) {
    return utf8Length(JSON.stringify(value));
  }
  function memoBuilder() {
    const inner = /* @__PURE__ */ new WeakSet();
    function memoize(obj) {
      if (inner.has(obj)) {
        return true;
      }
      inner.add(obj);
      return false;
    }
    function unmemoize(obj) {
      inner.delete(obj);
    }
    return [memoize, unmemoize];
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/envelope.js
  function createEnvelope(headers, items = []) {
    return [headers, items];
  }
  function addItemToEnvelope(envelope, newItem) {
    const [headers, items] = envelope;
    return [headers, [...items, newItem]];
  }
  function forEachEnvelopeItem(envelope, callback) {
    const envelopeItems = envelope[1];
    for (const envelopeItem of envelopeItems) {
      const envelopeItemType = envelopeItem[0].type;
      const result = callback(envelopeItem, envelopeItemType);
      if (result) {
        return true;
      }
    }
    return false;
  }
  function encodeUTF8(input) {
    const carrier = getSentryCarrier(GLOBAL_OBJ);
    return carrier.encodePolyfill ? carrier.encodePolyfill(input) : new TextEncoder().encode(input);
  }
  function serializeEnvelope(envelope) {
    const [envHeaders, items] = envelope;
    let parts = JSON.stringify(envHeaders);
    function append(next) {
      if (typeof parts === "string") {
        parts = typeof next === "string" ? parts + next : [encodeUTF8(parts), next];
      } else {
        parts.push(typeof next === "string" ? encodeUTF8(next) : next);
      }
    }
    for (const item of items) {
      const [itemHeaders, payload] = item;
      append(`
${JSON.stringify(itemHeaders)}
`);
      if (typeof payload === "string" || payload instanceof Uint8Array) {
        append(payload);
      } else {
        let stringifiedPayload;
        try {
          stringifiedPayload = JSON.stringify(payload);
        } catch (e) {
          stringifiedPayload = JSON.stringify(normalize(payload));
        }
        append(stringifiedPayload);
      }
    }
    return typeof parts === "string" ? parts : concatBuffers(parts);
  }
  function concatBuffers(buffers) {
    const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const buffer of buffers) {
      merged.set(buffer, offset);
      offset += buffer.length;
    }
    return merged;
  }
  function createSpanEnvelopeItem(spanJson) {
    const spanHeaders = {
      type: "span"
    };
    return [spanHeaders, spanJson];
  }
  function createAttachmentEnvelopeItem(attachment) {
    const buffer = typeof attachment.data === "string" ? encodeUTF8(attachment.data) : attachment.data;
    return [
      dropUndefinedKeys({
        type: "attachment",
        length: buffer.length,
        filename: attachment.filename,
        content_type: attachment.contentType,
        attachment_type: attachment.attachmentType
      }),
      buffer
    ];
  }
  var ITEM_TYPE_TO_DATA_CATEGORY_MAP = {
    session: "session",
    sessions: "session",
    attachment: "attachment",
    transaction: "transaction",
    event: "error",
    client_report: "internal",
    user_report: "default",
    profile: "profile",
    profile_chunk: "profile",
    replay_event: "replay",
    replay_recording: "replay",
    check_in: "monitor",
    feedback: "feedback",
    span: "span",
    raw_security: "security"
  };
  function envelopeItemTypeToDataCategory(type) {
    return ITEM_TYPE_TO_DATA_CATEGORY_MAP[type];
  }
  function getSdkMetadataForEnvelopeHeader(metadataOrEvent) {
    if (!metadataOrEvent?.sdk) {
      return;
    }
    const { name, version } = metadataOrEvent.sdk;
    return { name, version };
  }
  function createEventEnvelopeHeaders(event, sdkInfo, tunnel, dsn) {
    const dynamicSamplingContext = event.sdkProcessingMetadata?.dynamicSamplingContext;
    return {
      event_id: event.event_id,
      sent_at: (/* @__PURE__ */ new Date()).toISOString(),
      ...sdkInfo && { sdk: sdkInfo },
      ...!!tunnel && dsn && { dsn: dsnToString(dsn) },
      ...dynamicSamplingContext && {
        trace: dropUndefinedKeys({ ...dynamicSamplingContext })
      }
    };
  }

  // ../../node_modules/@sentry/core/build/esm/envelope.js
  function enhanceEventWithSdkInfo(event, sdkInfo) {
    if (!sdkInfo) {
      return event;
    }
    event.sdk = event.sdk || {};
    event.sdk.name = event.sdk.name || sdkInfo.name;
    event.sdk.version = event.sdk.version || sdkInfo.version;
    event.sdk.integrations = [...event.sdk.integrations || [], ...sdkInfo.integrations || []];
    event.sdk.packages = [...event.sdk.packages || [], ...sdkInfo.packages || []];
    return event;
  }
  function createSessionEnvelope(session, dsn, metadata, tunnel) {
    const sdkInfo = getSdkMetadataForEnvelopeHeader(metadata);
    const envelopeHeaders = {
      sent_at: (/* @__PURE__ */ new Date()).toISOString(),
      ...sdkInfo && { sdk: sdkInfo },
      ...!!tunnel && dsn && { dsn: dsnToString(dsn) }
    };
    const envelopeItem = "aggregates" in session ? [{ type: "sessions" }, session] : [{ type: "session" }, session.toJSON()];
    return createEnvelope(envelopeHeaders, [envelopeItem]);
  }
  function createEventEnvelope(event, dsn, metadata, tunnel) {
    const sdkInfo = getSdkMetadataForEnvelopeHeader(metadata);
    const eventType = event.type && event.type !== "replay_event" ? event.type : "event";
    enhanceEventWithSdkInfo(event, metadata?.sdk);
    const envelopeHeaders = createEventEnvelopeHeaders(event, sdkInfo, tunnel, dsn);
    delete event.sdkProcessingMetadata;
    const eventItem = [{ type: eventType }, event];
    return createEnvelope(envelopeHeaders, [eventItem]);
  }
  function createSpanEnvelope(spans, client) {
    function dscHasRequiredProps(dsc2) {
      return !!dsc2.trace_id && !!dsc2.public_key;
    }
    const dsc = getDynamicSamplingContextFromSpan(spans[0]);
    const dsn = client?.getDsn();
    const tunnel = client?.getOptions().tunnel;
    const headers = {
      sent_at: (/* @__PURE__ */ new Date()).toISOString(),
      ...dscHasRequiredProps(dsc) && { trace: dsc },
      ...!!tunnel && dsn && { dsn: dsnToString(dsn) }
    };
    const beforeSendSpan = client?.getOptions().beforeSendSpan;
    const convertToSpanJSON = beforeSendSpan ? (span) => {
      const spanJson = spanToJSON(span);
      const processedSpan = beforeSendSpan(spanJson);
      if (!processedSpan) {
        showSpanDropWarning();
        return spanJson;
      }
      return processedSpan;
    } : spanToJSON;
    const items = [];
    for (const span of spans) {
      const spanJson = convertToSpanJSON(span);
      if (spanJson) {
        items.push(createSpanEnvelopeItem(spanJson));
      }
    }
    return createEnvelope(headers, items);
  }

  // ../../node_modules/@sentry/core/build/esm/tracing/measurement.js
  function setMeasurement(name, value, unit, activeSpan = getActiveSpan()) {
    const rootSpan = activeSpan && getRootSpan(activeSpan);
    if (rootSpan) {
      DEBUG_BUILD && logger.log(`[Measurement] Setting measurement on root span: ${name} = ${value} ${unit}`);
      rootSpan.addEvent(name, {
        [SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE]: value,
        [SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT]: unit
      });
    }
  }
  function timedEventsToMeasurements(events) {
    if (!events || events.length === 0) {
      return void 0;
    }
    const measurements = {};
    events.forEach((event) => {
      const attributes = event.attributes || {};
      const unit = attributes[SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT];
      const value = attributes[SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE];
      if (typeof unit === "string" && typeof value === "number") {
        measurements[event.name] = { value, unit };
      }
    });
    return measurements;
  }

  // ../../node_modules/@sentry/core/build/esm/tracing/sentrySpan.js
  var MAX_SPAN_COUNT = 1e3;
  var SentrySpan = class {
    /** Epoch timestamp in seconds when the span started. */
    /** Epoch timestamp in seconds when the span ended. */
    /** Internal keeper of the status */
    /** The timed events added to this span. */
    /** if true, treat span as a standalone span (not part of a transaction) */
    /**
     * You should never call the constructor manually, always use `Sentry.startSpan()`
     * or other span methods.
     * @internal
     * @hideconstructor
     * @hidden
     */
    constructor(spanContext = {}) {
      this._traceId = spanContext.traceId || generateTraceId();
      this._spanId = spanContext.spanId || generateSpanId();
      this._startTime = spanContext.startTimestamp || timestampInSeconds();
      this._links = spanContext.links;
      this._attributes = {};
      this.setAttributes({
        [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "manual",
        [SEMANTIC_ATTRIBUTE_SENTRY_OP]: spanContext.op,
        ...spanContext.attributes
      });
      this._name = spanContext.name;
      if (spanContext.parentSpanId) {
        this._parentSpanId = spanContext.parentSpanId;
      }
      if ("sampled" in spanContext) {
        this._sampled = spanContext.sampled;
      }
      if (spanContext.endTimestamp) {
        this._endTime = spanContext.endTimestamp;
      }
      this._events = [];
      this._isStandaloneSpan = spanContext.isStandalone;
      if (this._endTime) {
        this._onSpanEnded();
      }
    }
    /** @inheritDoc */
    addLink(link) {
      if (this._links) {
        this._links.push(link);
      } else {
        this._links = [link];
      }
      return this;
    }
    /** @inheritDoc */
    addLinks(links) {
      if (this._links) {
        this._links.push(...links);
      } else {
        this._links = links;
      }
      return this;
    }
    /**
     * This should generally not be used,
     * but it is needed for being compliant with the OTEL Span interface.
     *
     * @hidden
     * @internal
     */
    recordException(_exception, _time) {
    }
    /** @inheritdoc */
    spanContext() {
      const { _spanId: spanId, _traceId: traceId, _sampled: sampled } = this;
      return {
        spanId,
        traceId,
        traceFlags: sampled ? TRACE_FLAG_SAMPLED : TRACE_FLAG_NONE
      };
    }
    /** @inheritdoc */
    setAttribute(key, value) {
      if (value === void 0) {
        delete this._attributes[key];
      } else {
        this._attributes[key] = value;
      }
      return this;
    }
    /** @inheritdoc */
    setAttributes(attributes) {
      Object.keys(attributes).forEach((key) => this.setAttribute(key, attributes[key]));
      return this;
    }
    /**
     * This should generally not be used,
     * but we need it for browser tracing where we want to adjust the start time afterwards.
     * USE THIS WITH CAUTION!
     *
     * @hidden
     * @internal
     */
    updateStartTime(timeInput) {
      this._startTime = spanTimeInputToSeconds(timeInput);
    }
    /**
     * @inheritDoc
     */
    setStatus(value) {
      this._status = value;
      return this;
    }
    /**
     * @inheritDoc
     */
    updateName(name) {
      this._name = name;
      this.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_SOURCE, "custom");
      return this;
    }
    /** @inheritdoc */
    end(endTimestamp) {
      if (this._endTime) {
        return;
      }
      this._endTime = spanTimeInputToSeconds(endTimestamp);
      logSpanEnd(this);
      this._onSpanEnded();
    }
    /**
     * Get JSON representation of this span.
     *
     * @hidden
     * @internal This method is purely for internal purposes and should not be used outside
     * of SDK code. If you need to get a JSON representation of a span,
     * use `spanToJSON(span)` instead.
     */
    getSpanJSON() {
      return dropUndefinedKeys({
        data: this._attributes,
        description: this._name,
        op: this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_OP],
        parent_span_id: this._parentSpanId,
        span_id: this._spanId,
        start_timestamp: this._startTime,
        status: getStatusMessage(this._status),
        timestamp: this._endTime,
        trace_id: this._traceId,
        origin: this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN],
        profile_id: this._attributes[SEMANTIC_ATTRIBUTE_PROFILE_ID],
        exclusive_time: this._attributes[SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME],
        measurements: timedEventsToMeasurements(this._events),
        is_segment: this._isStandaloneSpan && getRootSpan(this) === this || void 0,
        segment_id: this._isStandaloneSpan ? getRootSpan(this).spanContext().spanId : void 0,
        links: convertSpanLinksForEnvelope(this._links)
      });
    }
    /** @inheritdoc */
    isRecording() {
      return !this._endTime && !!this._sampled;
    }
    /**
     * @inheritdoc
     */
    addEvent(name, attributesOrStartTime, startTime) {
      DEBUG_BUILD && logger.log("[Tracing] Adding an event to span:", name);
      const time = isSpanTimeInput(attributesOrStartTime) ? attributesOrStartTime : startTime || timestampInSeconds();
      const attributes = isSpanTimeInput(attributesOrStartTime) ? {} : attributesOrStartTime || {};
      const event = {
        name,
        time: spanTimeInputToSeconds(time),
        attributes
      };
      this._events.push(event);
      return this;
    }
    /**
     * This method should generally not be used,
     * but for now we need a way to publicly check if the `_isStandaloneSpan` flag is set.
     * USE THIS WITH CAUTION!
     * @internal
     * @hidden
     * @experimental
     */
    isStandaloneSpan() {
      return !!this._isStandaloneSpan;
    }
    /** Emit `spanEnd` when the span is ended. */
    _onSpanEnded() {
      const client = getClient();
      if (client) {
        client.emit("spanEnd", this);
      }
      const isSegmentSpan = this._isStandaloneSpan || this === getRootSpan(this);
      if (!isSegmentSpan) {
        return;
      }
      if (this._isStandaloneSpan) {
        if (this._sampled) {
          sendSpanEnvelope(createSpanEnvelope([this], client));
        } else {
          DEBUG_BUILD && logger.log("[Tracing] Discarding standalone span because its trace was not chosen to be sampled.");
          if (client) {
            client.recordDroppedEvent("sample_rate", "span");
          }
        }
        return;
      }
      const transactionEvent = this._convertSpanToTransaction();
      if (transactionEvent) {
        const scope = getCapturedScopesOnSpan(this).scope || getCurrentScope();
        scope.captureEvent(transactionEvent);
      }
    }
    /**
     * Finish the transaction & prepare the event to send to Sentry.
     */
    _convertSpanToTransaction() {
      if (!isFullFinishedSpan(spanToJSON(this))) {
        return void 0;
      }
      if (!this._name) {
        DEBUG_BUILD && logger.warn("Transaction has no name, falling back to `<unlabeled transaction>`.");
        this._name = "<unlabeled transaction>";
      }
      const { scope: capturedSpanScope, isolationScope: capturedSpanIsolationScope } = getCapturedScopesOnSpan(this);
      if (this._sampled !== true) {
        return void 0;
      }
      const finishedSpans = getSpanDescendants(this).filter((span) => span !== this && !isStandaloneSpan(span));
      const spans = finishedSpans.map((span) => spanToJSON(span)).filter(isFullFinishedSpan);
      const source = this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE];
      delete this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME];
      spans.forEach((span) => {
        delete span.data[SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME];
      });
      const transaction = {
        contexts: {
          trace: spanToTransactionTraceContext(this)
        },
        spans: (
          // spans.sort() mutates the array, but `spans` is already a copy so we can safely do this here
          // we do not use spans anymore after this point
          spans.length > MAX_SPAN_COUNT ? spans.sort((a, b) => a.start_timestamp - b.start_timestamp).slice(0, MAX_SPAN_COUNT) : spans
        ),
        start_timestamp: this._startTime,
        timestamp: this._endTime,
        transaction: this._name,
        type: "transaction",
        sdkProcessingMetadata: {
          capturedSpanScope,
          capturedSpanIsolationScope,
          ...dropUndefinedKeys({
            dynamicSamplingContext: getDynamicSamplingContextFromSpan(this)
          })
        },
        ...source && {
          transaction_info: {
            source
          }
        }
      };
      const measurements = timedEventsToMeasurements(this._events);
      const hasMeasurements = measurements && Object.keys(measurements).length;
      if (hasMeasurements) {
        DEBUG_BUILD && logger.log(
          "[Measurements] Adding measurements to transaction event",
          JSON.stringify(measurements, void 0, 2)
        );
        transaction.measurements = measurements;
      }
      return transaction;
    }
  };
  function isSpanTimeInput(value) {
    return value && typeof value === "number" || value instanceof Date || Array.isArray(value);
  }
  function isFullFinishedSpan(input) {
    return !!input.start_timestamp && !!input.timestamp && !!input.span_id && !!input.trace_id;
  }
  function isStandaloneSpan(span) {
    return span instanceof SentrySpan && span.isStandaloneSpan();
  }
  function sendSpanEnvelope(envelope) {
    const client = getClient();
    if (!client) {
      return;
    }
    const spanItems = envelope[1];
    if (!spanItems || spanItems.length === 0) {
      client.recordDroppedEvent("before_send", "span");
      return;
    }
    client.sendEnvelope(envelope);
  }

  // ../../node_modules/@sentry/core/build/esm/tracing/trace.js
  var SUPPRESS_TRACING_KEY = "__SENTRY_SUPPRESS_TRACING__";
  function startInactiveSpan(options) {
    const acs = getAcs();
    if (acs.startInactiveSpan) {
      return acs.startInactiveSpan(options);
    }
    const spanArguments = parseSentrySpanArguments(options);
    const { forceTransaction, parentSpan: customParentSpan } = options;
    const wrapper = options.scope ? (callback) => withScope2(options.scope, callback) : customParentSpan !== void 0 ? (callback) => withActiveSpan(customParentSpan, callback) : (callback) => callback();
    return wrapper(() => {
      const scope = getCurrentScope();
      const parentSpan = getParentSpan(scope);
      const shouldSkipSpan = options.onlyIfParent && !parentSpan;
      if (shouldSkipSpan) {
        return new SentryNonRecordingSpan();
      }
      return createChildOrRootSpan({
        parentSpan,
        spanArguments,
        forceTransaction,
        scope
      });
    });
  }
  function withActiveSpan(span, callback) {
    const acs = getAcs();
    if (acs.withActiveSpan) {
      return acs.withActiveSpan(span, callback);
    }
    return withScope2((scope) => {
      _setSpanForScope(scope, span || void 0);
      return callback(scope);
    });
  }
  function createChildOrRootSpan({
    parentSpan,
    spanArguments,
    forceTransaction,
    scope
  }) {
    if (!hasSpansEnabled()) {
      const span2 = new SentryNonRecordingSpan();
      if (forceTransaction || !parentSpan) {
        const dsc = {
          sampled: "false",
          sample_rate: "0",
          transaction: spanArguments.name,
          ...getDynamicSamplingContextFromSpan(span2)
        };
        freezeDscOnSpan(span2, dsc);
      }
      return span2;
    }
    const isolationScope = getIsolationScope();
    let span;
    if (parentSpan && !forceTransaction) {
      span = _startChildSpan(parentSpan, scope, spanArguments);
      addChildSpanToSpan(parentSpan, span);
    } else if (parentSpan) {
      const dsc = getDynamicSamplingContextFromSpan(parentSpan);
      const { traceId, spanId: parentSpanId } = parentSpan.spanContext();
      const parentSampled = spanIsSampled(parentSpan);
      span = _startRootSpan(
        {
          traceId,
          parentSpanId,
          ...spanArguments
        },
        scope,
        parentSampled
      );
      freezeDscOnSpan(span, dsc);
    } else {
      const {
        traceId,
        dsc,
        parentSpanId,
        sampled: parentSampled
      } = {
        ...isolationScope.getPropagationContext(),
        ...scope.getPropagationContext()
      };
      span = _startRootSpan(
        {
          traceId,
          parentSpanId,
          ...spanArguments
        },
        scope,
        parentSampled
      );
      if (dsc) {
        freezeDscOnSpan(span, dsc);
      }
    }
    logSpanStart(span);
    setCapturedScopesOnSpan(span, scope, isolationScope);
    return span;
  }
  function parseSentrySpanArguments(options) {
    const exp = options.experimental || {};
    const initialCtx = {
      isStandalone: exp.standalone,
      ...options
    };
    if (options.startTime) {
      const ctx = { ...initialCtx };
      ctx.startTimestamp = spanTimeInputToSeconds(options.startTime);
      delete ctx.startTime;
      return ctx;
    }
    return initialCtx;
  }
  function getAcs() {
    const carrier = getMainCarrier();
    return getAsyncContextStrategy(carrier);
  }
  function _startRootSpan(spanArguments, scope, parentSampled) {
    const client = getClient();
    const options = client?.getOptions() || {};
    const { name = "", attributes } = spanArguments;
    const currentPropagationContext = scope.getPropagationContext();
    const [sampled, sampleRate, localSampleRateWasApplied] = scope.getScopeData().sdkProcessingMetadata[SUPPRESS_TRACING_KEY] ? [false] : sampleSpan(
      options,
      {
        name,
        parentSampled,
        attributes,
        parentSampleRate: parseSampleRate(currentPropagationContext.dsc?.sample_rate)
      },
      currentPropagationContext.sampleRand
    );
    const rootSpan = new SentrySpan({
      ...spanArguments,
      attributes: {
        [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "custom",
        [SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE]: sampleRate !== void 0 && localSampleRateWasApplied ? sampleRate : void 0,
        ...spanArguments.attributes
      },
      sampled
    });
    if (!sampled && client) {
      DEBUG_BUILD && logger.log("[Tracing] Discarding root span because its trace was not chosen to be sampled.");
      client.recordDroppedEvent("sample_rate", "transaction");
    }
    if (client) {
      client.emit("spanStart", rootSpan);
    }
    return rootSpan;
  }
  function _startChildSpan(parentSpan, scope, spanArguments) {
    const { spanId, traceId } = parentSpan.spanContext();
    const sampled = scope.getScopeData().sdkProcessingMetadata[SUPPRESS_TRACING_KEY] ? false : spanIsSampled(parentSpan);
    const childSpan = sampled ? new SentrySpan({
      ...spanArguments,
      parentSpanId: spanId,
      traceId,
      sampled
    }) : new SentryNonRecordingSpan({ traceId });
    addChildSpanToSpan(parentSpan, childSpan);
    const client = getClient();
    if (client) {
      client.emit("spanStart", childSpan);
      if (spanArguments.endTimestamp) {
        client.emit("spanEnd", childSpan);
      }
    }
    return childSpan;
  }
  function getParentSpan(scope) {
    const span = _getSpanForScope(scope);
    if (!span) {
      return void 0;
    }
    const client = getClient();
    const options = client ? client.getOptions() : {};
    if (options.parentSpanIsAlwaysRootSpan) {
      return getRootSpan(span);
    }
    return span;
  }

  // ../../node_modules/@sentry/core/build/esm/tracing/idleSpan.js
  var TRACING_DEFAULTS = {
    idleTimeout: 1e3,
    finalTimeout: 3e4,
    childSpanTimeout: 15e3
  };
  var FINISH_REASON_HEARTBEAT_FAILED = "heartbeatFailed";
  var FINISH_REASON_IDLE_TIMEOUT = "idleTimeout";
  var FINISH_REASON_FINAL_TIMEOUT = "finalTimeout";
  var FINISH_REASON_EXTERNAL_FINISH = "externalFinish";
  function startIdleSpan(startSpanOptions, options = {}) {
    const activities = /* @__PURE__ */ new Map();
    let _finished = false;
    let _idleTimeoutID;
    let _finishReason = FINISH_REASON_EXTERNAL_FINISH;
    let _autoFinishAllowed = !options.disableAutoFinish;
    const _cleanupHooks = [];
    const {
      idleTimeout = TRACING_DEFAULTS.idleTimeout,
      finalTimeout = TRACING_DEFAULTS.finalTimeout,
      childSpanTimeout = TRACING_DEFAULTS.childSpanTimeout,
      beforeSpanEnd
    } = options;
    const client = getClient();
    if (!client || !hasSpansEnabled()) {
      const span2 = new SentryNonRecordingSpan();
      const dsc = {
        sample_rate: "0",
        sampled: "false",
        ...getDynamicSamplingContextFromSpan(span2)
      };
      freezeDscOnSpan(span2, dsc);
      return span2;
    }
    const scope = getCurrentScope();
    const previousActiveSpan = getActiveSpan();
    const span = _startIdleSpan(startSpanOptions);
    span.end = new Proxy(span.end, {
      apply(target, thisArg, args) {
        if (beforeSpanEnd) {
          beforeSpanEnd(span);
        }
        if (thisArg instanceof SentryNonRecordingSpan) {
          return;
        }
        const [definedEndTimestamp, ...rest] = args;
        const timestamp = definedEndTimestamp || timestampInSeconds();
        const spanEndTimestamp = spanTimeInputToSeconds(timestamp);
        const spans = getSpanDescendants(span).filter((child) => child !== span);
        if (!spans.length) {
          onIdleSpanEnded(spanEndTimestamp);
          return Reflect.apply(target, thisArg, [spanEndTimestamp, ...rest]);
        }
        const childEndTimestamps = spans.map((span2) => spanToJSON(span2).timestamp).filter((timestamp2) => !!timestamp2);
        const latestSpanEndTimestamp = childEndTimestamps.length ? Math.max(...childEndTimestamps) : void 0;
        const spanStartTimestamp = spanToJSON(span).start_timestamp;
        const endTimestamp = Math.min(
          spanStartTimestamp ? spanStartTimestamp + finalTimeout / 1e3 : Infinity,
          Math.max(spanStartTimestamp || -Infinity, Math.min(spanEndTimestamp, latestSpanEndTimestamp || Infinity))
        );
        onIdleSpanEnded(endTimestamp);
        return Reflect.apply(target, thisArg, [endTimestamp, ...rest]);
      }
    });
    function _cancelIdleTimeout() {
      if (_idleTimeoutID) {
        clearTimeout(_idleTimeoutID);
        _idleTimeoutID = void 0;
      }
    }
    function _restartIdleTimeout(endTimestamp) {
      _cancelIdleTimeout();
      _idleTimeoutID = setTimeout(() => {
        if (!_finished && activities.size === 0 && _autoFinishAllowed) {
          _finishReason = FINISH_REASON_IDLE_TIMEOUT;
          span.end(endTimestamp);
        }
      }, idleTimeout);
    }
    function _restartChildSpanTimeout(endTimestamp) {
      _idleTimeoutID = setTimeout(() => {
        if (!_finished && _autoFinishAllowed) {
          _finishReason = FINISH_REASON_HEARTBEAT_FAILED;
          span.end(endTimestamp);
        }
      }, childSpanTimeout);
    }
    function _pushActivity(spanId) {
      _cancelIdleTimeout();
      activities.set(spanId, true);
      const endTimestamp = timestampInSeconds();
      _restartChildSpanTimeout(endTimestamp + childSpanTimeout / 1e3);
    }
    function _popActivity(spanId) {
      if (activities.has(spanId)) {
        activities.delete(spanId);
      }
      if (activities.size === 0) {
        const endTimestamp = timestampInSeconds();
        _restartIdleTimeout(endTimestamp + idleTimeout / 1e3);
      }
    }
    function onIdleSpanEnded(endTimestamp) {
      _finished = true;
      activities.clear();
      _cleanupHooks.forEach((cleanup) => cleanup());
      _setSpanForScope(scope, previousActiveSpan);
      const spanJSON = spanToJSON(span);
      const { start_timestamp: startTimestamp } = spanJSON;
      if (!startTimestamp) {
        return;
      }
      const attributes = spanJSON.data;
      if (!attributes[SEMANTIC_ATTRIBUTE_SENTRY_IDLE_SPAN_FINISH_REASON]) {
        span.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_IDLE_SPAN_FINISH_REASON, _finishReason);
      }
      logger.log(`[Tracing] Idle span "${spanJSON.op}" finished`);
      const childSpans = getSpanDescendants(span).filter((child) => child !== span);
      let discardedSpans = 0;
      childSpans.forEach((childSpan) => {
        if (childSpan.isRecording()) {
          childSpan.setStatus({ code: SPAN_STATUS_ERROR, message: "cancelled" });
          childSpan.end(endTimestamp);
          DEBUG_BUILD && logger.log("[Tracing] Cancelling span since span ended early", JSON.stringify(childSpan, void 0, 2));
        }
        const childSpanJSON = spanToJSON(childSpan);
        const { timestamp: childEndTimestamp = 0, start_timestamp: childStartTimestamp = 0 } = childSpanJSON;
        const spanStartedBeforeIdleSpanEnd = childStartTimestamp <= endTimestamp;
        const timeoutWithMarginOfError = (finalTimeout + idleTimeout) / 1e3;
        const spanEndedBeforeFinalTimeout = childEndTimestamp - childStartTimestamp <= timeoutWithMarginOfError;
        if (DEBUG_BUILD) {
          const stringifiedSpan = JSON.stringify(childSpan, void 0, 2);
          if (!spanStartedBeforeIdleSpanEnd) {
            logger.log("[Tracing] Discarding span since it happened after idle span was finished", stringifiedSpan);
          } else if (!spanEndedBeforeFinalTimeout) {
            logger.log("[Tracing] Discarding span since it finished after idle span final timeout", stringifiedSpan);
          }
        }
        if (!spanEndedBeforeFinalTimeout || !spanStartedBeforeIdleSpanEnd) {
          removeChildSpanFromSpan(span, childSpan);
          discardedSpans++;
        }
      });
      if (discardedSpans > 0) {
        span.setAttribute("sentry.idle_span_discarded_spans", discardedSpans);
      }
    }
    _cleanupHooks.push(
      client.on("spanStart", (startedSpan) => {
        if (_finished || startedSpan === span || !!spanToJSON(startedSpan).timestamp) {
          return;
        }
        const allSpans = getSpanDescendants(span);
        if (allSpans.includes(startedSpan)) {
          _pushActivity(startedSpan.spanContext().spanId);
        }
      })
    );
    _cleanupHooks.push(
      client.on("spanEnd", (endedSpan) => {
        if (_finished) {
          return;
        }
        _popActivity(endedSpan.spanContext().spanId);
      })
    );
    _cleanupHooks.push(
      client.on("idleSpanEnableAutoFinish", (spanToAllowAutoFinish) => {
        if (spanToAllowAutoFinish === span) {
          _autoFinishAllowed = true;
          _restartIdleTimeout();
          if (activities.size) {
            _restartChildSpanTimeout();
          }
        }
      })
    );
    if (!options.disableAutoFinish) {
      _restartIdleTimeout();
    }
    setTimeout(() => {
      if (!_finished) {
        span.setStatus({ code: SPAN_STATUS_ERROR, message: "deadline_exceeded" });
        _finishReason = FINISH_REASON_FINAL_TIMEOUT;
        span.end();
      }
    }, finalTimeout);
    return span;
  }
  function _startIdleSpan(options) {
    const span = startInactiveSpan(options);
    _setSpanForScope(getCurrentScope(), span);
    DEBUG_BUILD && logger.log("[Tracing] Started span is an idle span");
    return span;
  }

  // ../../node_modules/@sentry/core/build/esm/eventProcessors.js
  function notifyEventProcessors(processors, event, hint, index = 0) {
    return new SyncPromise((resolve, reject) => {
      const processor = processors[index];
      if (event === null || typeof processor !== "function") {
        resolve(event);
      } else {
        const result = processor({ ...event }, hint);
        DEBUG_BUILD && processor.id && result === null && logger.log(`Event processor "${processor.id}" dropped event`);
        if (isThenable(result)) {
          void result.then((final) => notifyEventProcessors(processors, final, hint, index + 1).then(resolve)).then(null, reject);
        } else {
          void notifyEventProcessors(processors, result, hint, index + 1).then(resolve).then(null, reject);
        }
      }
    });
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/debug-ids.js
  var parsedStackResults;
  var lastKeysCount;
  var cachedFilenameDebugIds;
  function getFilenameToDebugIdMap(stackParser) {
    const debugIdMap = GLOBAL_OBJ._sentryDebugIds;
    if (!debugIdMap) {
      return {};
    }
    const debugIdKeys = Object.keys(debugIdMap);
    if (cachedFilenameDebugIds && debugIdKeys.length === lastKeysCount) {
      return cachedFilenameDebugIds;
    }
    lastKeysCount = debugIdKeys.length;
    cachedFilenameDebugIds = debugIdKeys.reduce((acc, stackKey) => {
      if (!parsedStackResults) {
        parsedStackResults = {};
      }
      const result = parsedStackResults[stackKey];
      if (result) {
        acc[result[0]] = result[1];
      } else {
        const parsedStack = stackParser(stackKey);
        for (let i = parsedStack.length - 1; i >= 0; i--) {
          const stackFrame = parsedStack[i];
          const filename = stackFrame?.filename;
          const debugId = debugIdMap[stackKey];
          if (filename && debugId) {
            acc[filename] = debugId;
            parsedStackResults[stackKey] = [filename, debugId];
            break;
          }
        }
      }
      return acc;
    }, {});
    return cachedFilenameDebugIds;
  }

  // ../../node_modules/@sentry/core/build/esm/utils/applyScopeDataToEvent.js
  function applyScopeDataToEvent(event, data) {
    const { fingerprint, span, breadcrumbs, sdkProcessingMetadata } = data;
    applyDataToEvent(event, data);
    if (span) {
      applySpanToEvent(event, span);
    }
    applyFingerprintToEvent(event, fingerprint);
    applyBreadcrumbsToEvent(event, breadcrumbs);
    applySdkMetadataToEvent(event, sdkProcessingMetadata);
  }
  function mergeScopeData(data, mergeData) {
    const {
      extra,
      tags,
      user,
      contexts,
      level,
      sdkProcessingMetadata,
      breadcrumbs,
      fingerprint,
      eventProcessors,
      attachments,
      propagationContext,
      transactionName,
      span
    } = mergeData;
    mergeAndOverwriteScopeData(data, "extra", extra);
    mergeAndOverwriteScopeData(data, "tags", tags);
    mergeAndOverwriteScopeData(data, "user", user);
    mergeAndOverwriteScopeData(data, "contexts", contexts);
    data.sdkProcessingMetadata = merge(data.sdkProcessingMetadata, sdkProcessingMetadata, 2);
    if (level) {
      data.level = level;
    }
    if (transactionName) {
      data.transactionName = transactionName;
    }
    if (span) {
      data.span = span;
    }
    if (breadcrumbs.length) {
      data.breadcrumbs = [...data.breadcrumbs, ...breadcrumbs];
    }
    if (fingerprint.length) {
      data.fingerprint = [...data.fingerprint, ...fingerprint];
    }
    if (eventProcessors.length) {
      data.eventProcessors = [...data.eventProcessors, ...eventProcessors];
    }
    if (attachments.length) {
      data.attachments = [...data.attachments, ...attachments];
    }
    data.propagationContext = { ...data.propagationContext, ...propagationContext };
  }
  function mergeAndOverwriteScopeData(data, prop, mergeVal) {
    data[prop] = merge(data[prop], mergeVal, 1);
  }
  function applyDataToEvent(event, data) {
    const { extra, tags, user, contexts, level, transactionName } = data;
    const cleanedExtra = dropUndefinedKeys(extra);
    if (Object.keys(cleanedExtra).length) {
      event.extra = { ...cleanedExtra, ...event.extra };
    }
    const cleanedTags = dropUndefinedKeys(tags);
    if (Object.keys(cleanedTags).length) {
      event.tags = { ...cleanedTags, ...event.tags };
    }
    const cleanedUser = dropUndefinedKeys(user);
    if (Object.keys(cleanedUser).length) {
      event.user = { ...cleanedUser, ...event.user };
    }
    const cleanedContexts = dropUndefinedKeys(contexts);
    if (Object.keys(cleanedContexts).length) {
      event.contexts = { ...cleanedContexts, ...event.contexts };
    }
    if (level) {
      event.level = level;
    }
    if (transactionName && event.type !== "transaction") {
      event.transaction = transactionName;
    }
  }
  function applyBreadcrumbsToEvent(event, breadcrumbs) {
    const mergedBreadcrumbs = [...event.breadcrumbs || [], ...breadcrumbs];
    event.breadcrumbs = mergedBreadcrumbs.length ? mergedBreadcrumbs : void 0;
  }
  function applySdkMetadataToEvent(event, sdkProcessingMetadata) {
    event.sdkProcessingMetadata = {
      ...event.sdkProcessingMetadata,
      ...sdkProcessingMetadata
    };
  }
  function applySpanToEvent(event, span) {
    event.contexts = {
      trace: spanToTraceContext(span),
      ...event.contexts
    };
    event.sdkProcessingMetadata = {
      dynamicSamplingContext: getDynamicSamplingContextFromSpan(span),
      ...event.sdkProcessingMetadata
    };
    const rootSpan = getRootSpan(span);
    const transactionName = spanToJSON(rootSpan).description;
    if (transactionName && !event.transaction && event.type === "transaction") {
      event.transaction = transactionName;
    }
  }
  function applyFingerprintToEvent(event, fingerprint) {
    event.fingerprint = event.fingerprint ? Array.isArray(event.fingerprint) ? event.fingerprint : [event.fingerprint] : [];
    if (fingerprint) {
      event.fingerprint = event.fingerprint.concat(fingerprint);
    }
    if (!event.fingerprint.length) {
      delete event.fingerprint;
    }
  }

  // ../../node_modules/@sentry/core/build/esm/utils/prepareEvent.js
  function prepareEvent(options, event, hint, scope, client, isolationScope) {
    const { normalizeDepth = 3, normalizeMaxBreadth = 1e3 } = options;
    const prepared = {
      ...event,
      event_id: event.event_id || hint.event_id || uuid4(),
      timestamp: event.timestamp || dateTimestampInSeconds()
    };
    const integrations = hint.integrations || options.integrations.map((i) => i.name);
    applyClientOptions(prepared, options);
    applyIntegrationsMetadata(prepared, integrations);
    if (client) {
      client.emit("applyFrameMetadata", event);
    }
    if (event.type === void 0) {
      applyDebugIds(prepared, options.stackParser);
    }
    const finalScope = getFinalScope(scope, hint.captureContext);
    if (hint.mechanism) {
      addExceptionMechanism(prepared, hint.mechanism);
    }
    const clientEventProcessors = client ? client.getEventProcessors() : [];
    const data = getGlobalScope().getScopeData();
    if (isolationScope) {
      const isolationData = isolationScope.getScopeData();
      mergeScopeData(data, isolationData);
    }
    if (finalScope) {
      const finalScopeData = finalScope.getScopeData();
      mergeScopeData(data, finalScopeData);
    }
    const attachments = [...hint.attachments || [], ...data.attachments];
    if (attachments.length) {
      hint.attachments = attachments;
    }
    applyScopeDataToEvent(prepared, data);
    const eventProcessors = [
      ...clientEventProcessors,
      // Run scope event processors _after_ all other processors
      ...data.eventProcessors
    ];
    const result = notifyEventProcessors(eventProcessors, prepared, hint);
    return result.then((evt) => {
      if (evt) {
        applyDebugMeta(evt);
      }
      if (typeof normalizeDepth === "number" && normalizeDepth > 0) {
        return normalizeEvent(evt, normalizeDepth, normalizeMaxBreadth);
      }
      return evt;
    });
  }
  function applyClientOptions(event, options) {
    const { environment, release, dist, maxValueLength = 250 } = options;
    event.environment = event.environment || environment || DEFAULT_ENVIRONMENT;
    if (!event.release && release) {
      event.release = release;
    }
    if (!event.dist && dist) {
      event.dist = dist;
    }
    if (event.message) {
      event.message = truncate(event.message, maxValueLength);
    }
    const exception = event.exception?.values?.[0];
    if (exception?.value) {
      exception.value = truncate(exception.value, maxValueLength);
    }
    const request = event.request;
    if (request?.url) {
      request.url = truncate(request.url, maxValueLength);
    }
  }
  function applyDebugIds(event, stackParser) {
    const filenameDebugIdMap = getFilenameToDebugIdMap(stackParser);
    event.exception?.values?.forEach((exception) => {
      exception.stacktrace?.frames?.forEach((frame) => {
        if (frame.filename) {
          frame.debug_id = filenameDebugIdMap[frame.filename];
        }
      });
    });
  }
  function applyDebugMeta(event) {
    const filenameDebugIdMap = {};
    event.exception?.values?.forEach((exception) => {
      exception.stacktrace?.frames?.forEach((frame) => {
        if (frame.debug_id) {
          if (frame.abs_path) {
            filenameDebugIdMap[frame.abs_path] = frame.debug_id;
          } else if (frame.filename) {
            filenameDebugIdMap[frame.filename] = frame.debug_id;
          }
          delete frame.debug_id;
        }
      });
    });
    if (Object.keys(filenameDebugIdMap).length === 0) {
      return;
    }
    event.debug_meta = event.debug_meta || {};
    event.debug_meta.images = event.debug_meta.images || [];
    const images = event.debug_meta.images;
    Object.entries(filenameDebugIdMap).forEach(([filename, debug_id]) => {
      images.push({
        type: "sourcemap",
        code_file: filename,
        debug_id
      });
    });
  }
  function applyIntegrationsMetadata(event, integrationNames) {
    if (integrationNames.length > 0) {
      event.sdk = event.sdk || {};
      event.sdk.integrations = [...event.sdk.integrations || [], ...integrationNames];
    }
  }
  function normalizeEvent(event, depth, maxBreadth) {
    if (!event) {
      return null;
    }
    const normalized = {
      ...event,
      ...event.breadcrumbs && {
        breadcrumbs: event.breadcrumbs.map((b) => ({
          ...b,
          ...b.data && {
            data: normalize(b.data, depth, maxBreadth)
          }
        }))
      },
      ...event.user && {
        user: normalize(event.user, depth, maxBreadth)
      },
      ...event.contexts && {
        contexts: normalize(event.contexts, depth, maxBreadth)
      },
      ...event.extra && {
        extra: normalize(event.extra, depth, maxBreadth)
      }
    };
    if (event.contexts?.trace && normalized.contexts) {
      normalized.contexts.trace = event.contexts.trace;
      if (event.contexts.trace.data) {
        normalized.contexts.trace.data = normalize(event.contexts.trace.data, depth, maxBreadth);
      }
    }
    if (event.spans) {
      normalized.spans = event.spans.map((span) => {
        return {
          ...span,
          ...span.data && {
            data: normalize(span.data, depth, maxBreadth)
          }
        };
      });
    }
    if (event.contexts?.flags && normalized.contexts) {
      normalized.contexts.flags = normalize(event.contexts.flags, 3, maxBreadth);
    }
    return normalized;
  }
  function getFinalScope(scope, captureContext) {
    if (!captureContext) {
      return scope;
    }
    const finalScope = scope ? scope.clone() : new Scope();
    finalScope.update(captureContext);
    return finalScope;
  }
  function parseEventHintOrCaptureContext(hint) {
    if (!hint) {
      return void 0;
    }
    if (hintIsScopeOrFunction(hint)) {
      return { captureContext: hint };
    }
    if (hintIsScopeContext(hint)) {
      return {
        captureContext: hint
      };
    }
    return hint;
  }
  function hintIsScopeOrFunction(hint) {
    return hint instanceof Scope || typeof hint === "function";
  }
  var captureContextKeys = [
    "user",
    "level",
    "extra",
    "contexts",
    "tags",
    "fingerprint",
    "propagationContext"
  ];
  function hintIsScopeContext(hint) {
    return Object.keys(hint).some((key) => captureContextKeys.includes(key));
  }

  // ../../node_modules/@sentry/core/build/esm/exports.js
  function captureException(exception, hint) {
    return getCurrentScope().captureException(exception, parseEventHintOrCaptureContext(hint));
  }
  function captureEvent(event, hint) {
    return getCurrentScope().captureEvent(event, hint);
  }
  function setUser(user) {
    getIsolationScope().setUser(user);
  }
  function isEnabled() {
    const client = getClient();
    return client?.getOptions().enabled !== false && !!client?.getTransport();
  }
  function startSession(context) {
    const isolationScope = getIsolationScope();
    const currentScope = getCurrentScope();
    const { userAgent } = GLOBAL_OBJ.navigator || {};
    const session = makeSession({
      user: currentScope.getUser() || isolationScope.getUser(),
      ...userAgent && { userAgent },
      ...context
    });
    const currentSession = isolationScope.getSession();
    if (currentSession?.status === "ok") {
      updateSession(currentSession, { status: "exited" });
    }
    endSession();
    isolationScope.setSession(session);
    return session;
  }
  function endSession() {
    const isolationScope = getIsolationScope();
    const currentScope = getCurrentScope();
    const session = currentScope.getSession() || isolationScope.getSession();
    if (session) {
      closeSession(session);
    }
    _sendSessionUpdate();
    isolationScope.setSession();
  }
  function _sendSessionUpdate() {
    const isolationScope = getIsolationScope();
    const client = getClient();
    const session = isolationScope.getSession();
    if (session && client) {
      client.captureSession(session);
    }
  }
  function captureSession(end = false) {
    if (end) {
      endSession();
      return;
    }
    _sendSessionUpdate();
  }

  // ../../node_modules/@sentry/core/build/esm/api.js
  var SENTRY_API_VERSION = "7";
  function getBaseApiEndpoint(dsn) {
    const protocol = dsn.protocol ? `${dsn.protocol}:` : "";
    const port = dsn.port ? `:${dsn.port}` : "";
    return `${protocol}//${dsn.host}${port}${dsn.path ? `/${dsn.path}` : ""}/api/`;
  }
  function _getIngestEndpoint(dsn) {
    return `${getBaseApiEndpoint(dsn)}${dsn.projectId}/envelope/`;
  }
  function _encodedAuth(dsn, sdkInfo) {
    const params = {
      sentry_version: SENTRY_API_VERSION
    };
    if (dsn.publicKey) {
      params.sentry_key = dsn.publicKey;
    }
    if (sdkInfo) {
      params.sentry_client = `${sdkInfo.name}/${sdkInfo.version}`;
    }
    return new URLSearchParams(params).toString();
  }
  function getEnvelopeEndpointWithUrlEncodedAuth(dsn, tunnel, sdkInfo) {
    return tunnel ? tunnel : `${_getIngestEndpoint(dsn)}?${_encodedAuth(dsn, sdkInfo)}`;
  }

  // ../../node_modules/@sentry/core/build/esm/integration.js
  var installedIntegrations = [];
  function filterDuplicates(integrations) {
    const integrationsByName = {};
    integrations.forEach((currentInstance) => {
      const { name } = currentInstance;
      const existingInstance = integrationsByName[name];
      if (existingInstance && !existingInstance.isDefaultInstance && currentInstance.isDefaultInstance) {
        return;
      }
      integrationsByName[name] = currentInstance;
    });
    return Object.values(integrationsByName);
  }
  function getIntegrationsToSetup(options) {
    const defaultIntegrations = options.defaultIntegrations || [];
    const userIntegrations = options.integrations;
    defaultIntegrations.forEach((integration) => {
      integration.isDefaultInstance = true;
    });
    let integrations;
    if (Array.isArray(userIntegrations)) {
      integrations = [...defaultIntegrations, ...userIntegrations];
    } else if (typeof userIntegrations === "function") {
      const resolvedUserIntegrations = userIntegrations(defaultIntegrations);
      integrations = Array.isArray(resolvedUserIntegrations) ? resolvedUserIntegrations : [resolvedUserIntegrations];
    } else {
      integrations = defaultIntegrations;
    }
    return filterDuplicates(integrations);
  }
  function setupIntegrations(client, integrations) {
    const integrationIndex = {};
    integrations.forEach((integration) => {
      if (integration) {
        setupIntegration(client, integration, integrationIndex);
      }
    });
    return integrationIndex;
  }
  function afterSetupIntegrations(client, integrations) {
    for (const integration of integrations) {
      if (integration?.afterAllSetup) {
        integration.afterAllSetup(client);
      }
    }
  }
  function setupIntegration(client, integration, integrationIndex) {
    if (integrationIndex[integration.name]) {
      DEBUG_BUILD && logger.log(`Integration skipped because it was already installed: ${integration.name}`);
      return;
    }
    integrationIndex[integration.name] = integration;
    if (installedIntegrations.indexOf(integration.name) === -1 && typeof integration.setupOnce === "function") {
      integration.setupOnce();
      installedIntegrations.push(integration.name);
    }
    if (integration.setup && typeof integration.setup === "function") {
      integration.setup(client);
    }
    if (typeof integration.preprocessEvent === "function") {
      const callback = integration.preprocessEvent.bind(integration);
      client.on("preprocessEvent", (event, hint) => callback(event, hint, client));
    }
    if (typeof integration.processEvent === "function") {
      const callback = integration.processEvent.bind(integration);
      const processor = Object.assign((event, hint) => callback(event, hint, client), {
        id: integration.name
      });
      client.addEventProcessor(processor);
    }
    DEBUG_BUILD && logger.log(`Integration installed: ${integration.name}`);
  }
  function defineIntegration(fn) {
    return fn;
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/clientreport.js
  function createClientReportEnvelope(discarded_events, dsn, timestamp) {
    const clientReportItem = [
      { type: "client_report" },
      {
        timestamp: timestamp || dateTimestampInSeconds(),
        discarded_events
      }
    ];
    return createEnvelope(dsn ? { dsn } : {}, [clientReportItem]);
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/error.js
  var SentryError = class extends Error {
    constructor(message, logLevel = "warn") {
      super(message);
      this.message = message;
      this.logLevel = logLevel;
    }
  };

  // ../../node_modules/@sentry/core/build/esm/utils/eventUtils.js
  function getPossibleEventMessages(event) {
    const possibleMessages = [];
    if (event.message) {
      possibleMessages.push(event.message);
    }
    try {
      const lastException = event.exception.values[event.exception.values.length - 1];
      if (lastException?.value) {
        possibleMessages.push(lastException.value);
        if (lastException.type) {
          possibleMessages.push(`${lastException.type}: ${lastException.value}`);
        }
      }
    } catch (e) {
    }
    return possibleMessages;
  }

  // ../../node_modules/@sentry/core/build/esm/utils/transactionEvent.js
  function convertTransactionEventToSpanJson(event) {
    const { trace_id, parent_span_id, span_id, status, origin, data, op } = event.contexts?.trace ?? {};
    return dropUndefinedKeys({
      data: data ?? {},
      description: event.transaction,
      op,
      parent_span_id,
      span_id: span_id ?? "",
      start_timestamp: event.start_timestamp ?? 0,
      status,
      timestamp: event.timestamp,
      trace_id: trace_id ?? "",
      origin,
      profile_id: data?.[SEMANTIC_ATTRIBUTE_PROFILE_ID],
      exclusive_time: data?.[SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME],
      measurements: event.measurements,
      is_segment: true
    });
  }
  function convertSpanJsonToTransactionEvent(span) {
    const event = {
      type: "transaction",
      timestamp: span.timestamp,
      start_timestamp: span.start_timestamp,
      transaction: span.description,
      contexts: {
        trace: {
          trace_id: span.trace_id,
          span_id: span.span_id,
          parent_span_id: span.parent_span_id,
          op: span.op,
          status: span.status,
          origin: span.origin,
          data: {
            ...span.data,
            ...span.profile_id && { [SEMANTIC_ATTRIBUTE_PROFILE_ID]: span.profile_id },
            ...span.exclusive_time && { [SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME]: span.exclusive_time }
          }
        }
      },
      measurements: span.measurements
    };
    return dropUndefinedKeys(event);
  }

  // ../../node_modules/@sentry/core/build/esm/client.js
  var ALREADY_SEEN_ERROR = "Not capturing exception because it's already been captured.";
  var MISSING_RELEASE_FOR_SESSION_ERROR = "Discarded session because of missing or non-string release";
  var Client = class {
    /** Options passed to the SDK. */
    /** The client Dsn, if specified in options. Without this Dsn, the SDK will be disabled. */
    /** Array of set up integrations. */
    /** Number of calls being processed */
    /** Holds flushable  */
    // eslint-disable-next-line @typescript-eslint/ban-types
    /**
     * Initializes this client instance.
     *
     * @param options Options for the client.
     */
    constructor(options) {
      this._options = options;
      this._integrations = {};
      this._numProcessing = 0;
      this._outcomes = {};
      this._hooks = {};
      this._eventProcessors = [];
      if (options.dsn) {
        this._dsn = makeDsn(options.dsn);
      } else {
        DEBUG_BUILD && logger.warn("No DSN provided, client will not send events.");
      }
      if (this._dsn) {
        const url = getEnvelopeEndpointWithUrlEncodedAuth(
          this._dsn,
          options.tunnel,
          options._metadata ? options._metadata.sdk : void 0
        );
        this._transport = options.transport({
          tunnel: this._options.tunnel,
          recordDroppedEvent: this.recordDroppedEvent.bind(this),
          ...options.transportOptions,
          url
        });
      }
    }
    /**
     * Captures an exception event and sends it to Sentry.
     *
     * Unlike `captureException` exported from every SDK, this method requires that you pass it the current scope.
     */
    captureException(exception, hint, scope) {
      const eventId = uuid4();
      if (checkOrSetAlreadyCaught(exception)) {
        DEBUG_BUILD && logger.log(ALREADY_SEEN_ERROR);
        return eventId;
      }
      const hintWithEventId = {
        event_id: eventId,
        ...hint
      };
      this._process(
        this.eventFromException(exception, hintWithEventId).then(
          (event) => this._captureEvent(event, hintWithEventId, scope)
        )
      );
      return hintWithEventId.event_id;
    }
    /**
     * Captures a message event and sends it to Sentry.
     *
     * Unlike `captureMessage` exported from every SDK, this method requires that you pass it the current scope.
     */
    captureMessage(message, level, hint, currentScope) {
      const hintWithEventId = {
        event_id: uuid4(),
        ...hint
      };
      const eventMessage = isParameterizedString(message) ? message : String(message);
      const promisedEvent = isPrimitive(message) ? this.eventFromMessage(eventMessage, level, hintWithEventId) : this.eventFromException(message, hintWithEventId);
      this._process(promisedEvent.then((event) => this._captureEvent(event, hintWithEventId, currentScope)));
      return hintWithEventId.event_id;
    }
    /**
     * Captures a manually created event and sends it to Sentry.
     *
     * Unlike `captureEvent` exported from every SDK, this method requires that you pass it the current scope.
     */
    captureEvent(event, hint, currentScope) {
      const eventId = uuid4();
      if (hint?.originalException && checkOrSetAlreadyCaught(hint.originalException)) {
        DEBUG_BUILD && logger.log(ALREADY_SEEN_ERROR);
        return eventId;
      }
      const hintWithEventId = {
        event_id: eventId,
        ...hint
      };
      const sdkProcessingMetadata = event.sdkProcessingMetadata || {};
      const capturedSpanScope = sdkProcessingMetadata.capturedSpanScope;
      const capturedSpanIsolationScope = sdkProcessingMetadata.capturedSpanIsolationScope;
      this._process(
        this._captureEvent(event, hintWithEventId, capturedSpanScope || currentScope, capturedSpanIsolationScope)
      );
      return hintWithEventId.event_id;
    }
    /**
     * Captures a session.
     */
    captureSession(session) {
      this.sendSession(session);
      updateSession(session, { init: false });
    }
    /**
     * Create a cron monitor check in and send it to Sentry. This method is not available on all clients.
     *
     * @param checkIn An object that describes a check in.
     * @param upsertMonitorConfig An optional object that describes a monitor config. Use this if you want
     * to create a monitor automatically when sending a check in.
     * @param scope An optional scope containing event metadata.
     * @returns A string representing the id of the check in.
     */
    /**
     * Get the current Dsn.
     */
    getDsn() {
      return this._dsn;
    }
    /**
     * Get the current options.
     */
    getOptions() {
      return this._options;
    }
    /**
     * Get the SDK metadata.
     * @see SdkMetadata
     */
    getSdkMetadata() {
      return this._options._metadata;
    }
    /**
     * Returns the transport that is used by the client.
     * Please note that the transport gets lazy initialized so it will only be there once the first event has been sent.
     */
    getTransport() {
      return this._transport;
    }
    /**
     * Wait for all events to be sent or the timeout to expire, whichever comes first.
     *
     * @param timeout Maximum time in ms the client should wait for events to be flushed. Omitting this parameter will
     *   cause the client to wait until all events are sent before resolving the promise.
     * @returns A promise that will resolve with `true` if all events are sent before the timeout, or `false` if there are
     * still events in the queue when the timeout is reached.
     */
    flush(timeout) {
      const transport = this._transport;
      if (transport) {
        this.emit("flush");
        return this._isClientDoneProcessing(timeout).then((clientFinished) => {
          return transport.flush(timeout).then((transportFlushed) => clientFinished && transportFlushed);
        });
      } else {
        return resolvedSyncPromise(true);
      }
    }
    /**
     * Flush the event queue and set the client to `enabled = false`. See {@link Client.flush}.
     *
     * @param {number} timeout Maximum time in ms the client should wait before shutting down. Omitting this parameter will cause
     *   the client to wait until all events are sent before disabling itself.
     * @returns {Promise<boolean>} A promise which resolves to `true` if the flush completes successfully before the timeout, or `false` if
     * it doesn't.
     */
    close(timeout) {
      return this.flush(timeout).then((result) => {
        this.getOptions().enabled = false;
        this.emit("close");
        return result;
      });
    }
    /**
     * Get all installed event processors.
     */
    getEventProcessors() {
      return this._eventProcessors;
    }
    /**
     * Adds an event processor that applies to any event processed by this client.
     */
    addEventProcessor(eventProcessor) {
      this._eventProcessors.push(eventProcessor);
    }
    /**
     * Initialize this client.
     * Call this after the client was set on a scope.
     */
    init() {
      if (this._isEnabled() || // Force integrations to be setup even if no DSN was set when we have
      // Spotlight enabled. This is particularly important for browser as we
      // don't support the `spotlight` option there and rely on the users
      // adding the `spotlightBrowserIntegration()` to their integrations which
      // wouldn't get initialized with the check below when there's no DSN set.
      this._options.integrations.some(({ name }) => name.startsWith("Spotlight"))) {
        this._setupIntegrations();
      }
    }
    /**
     * Gets an installed integration by its name.
     *
     * @returns {Integration|undefined} The installed integration or `undefined` if no integration with that `name` was installed.
     */
    getIntegrationByName(integrationName) {
      return this._integrations[integrationName];
    }
    /**
     * Add an integration to the client.
     * This can be used to e.g. lazy load integrations.
     * In most cases, this should not be necessary,
     * and you're better off just passing the integrations via `integrations: []` at initialization time.
     * However, if you find the need to conditionally load & add an integration, you can use `addIntegration` to do so.
     */
    addIntegration(integration) {
      const isAlreadyInstalled = this._integrations[integration.name];
      setupIntegration(this, integration, this._integrations);
      if (!isAlreadyInstalled) {
        afterSetupIntegrations(this, [integration]);
      }
    }
    /**
     * Send a fully prepared event to Sentry.
     */
    sendEvent(event, hint = {}) {
      this.emit("beforeSendEvent", event, hint);
      let env = createEventEnvelope(event, this._dsn, this._options._metadata, this._options.tunnel);
      for (const attachment of hint.attachments || []) {
        env = addItemToEnvelope(env, createAttachmentEnvelopeItem(attachment));
      }
      const promise = this.sendEnvelope(env);
      if (promise) {
        promise.then((sendResponse) => this.emit("afterSendEvent", event, sendResponse), null);
      }
    }
    /**
     * Send a session or session aggregrates to Sentry.
     */
    sendSession(session) {
      const { release: clientReleaseOption, environment: clientEnvironmentOption = DEFAULT_ENVIRONMENT } = this._options;
      if ("aggregates" in session) {
        const sessionAttrs = session.attrs || {};
        if (!sessionAttrs.release && !clientReleaseOption) {
          DEBUG_BUILD && logger.warn(MISSING_RELEASE_FOR_SESSION_ERROR);
          return;
        }
        sessionAttrs.release = sessionAttrs.release || clientReleaseOption;
        sessionAttrs.environment = sessionAttrs.environment || clientEnvironmentOption;
        session.attrs = sessionAttrs;
      } else {
        if (!session.release && !clientReleaseOption) {
          DEBUG_BUILD && logger.warn(MISSING_RELEASE_FOR_SESSION_ERROR);
          return;
        }
        session.release = session.release || clientReleaseOption;
        session.environment = session.environment || clientEnvironmentOption;
      }
      this.emit("beforeSendSession", session);
      const env = createSessionEnvelope(session, this._dsn, this._options._metadata, this._options.tunnel);
      this.sendEnvelope(env);
    }
    /**
     * Record on the client that an event got dropped (ie, an event that will not be sent to Sentry).
     */
    recordDroppedEvent(reason, category, count = 1) {
      if (this._options.sendClientReports) {
        const key = `${reason}:${category}`;
        DEBUG_BUILD && logger.log(`Recording outcome: "${key}"${count > 1 ? ` (${count} times)` : ""}`);
        this._outcomes[key] = (this._outcomes[key] || 0) + count;
      }
    }
    /* eslint-disable @typescript-eslint/unified-signatures */
    /**
     * Register a callback for whenever a span is started.
     * Receives the span as argument.
     * @returns {() => void} A function that, when executed, removes the registered callback.
     */
    /**
     * Register a hook oin this client.
     */
    on(hook, callback) {
      const hooks = this._hooks[hook] = this._hooks[hook] || [];
      hooks.push(callback);
      return () => {
        const cbIndex = hooks.indexOf(callback);
        if (cbIndex > -1) {
          hooks.splice(cbIndex, 1);
        }
      };
    }
    /** Fire a hook whenever a span starts. */
    /**
     * Emit a hook that was previously registered via `on()`.
     */
    emit(hook, ...rest) {
      const callbacks = this._hooks[hook];
      if (callbacks) {
        callbacks.forEach((callback) => callback(...rest));
      }
    }
    /**
     * Send an envelope to Sentry.
     */
    sendEnvelope(envelope) {
      this.emit("beforeEnvelope", envelope);
      if (this._isEnabled() && this._transport) {
        return this._transport.send(envelope).then(null, (reason) => {
          DEBUG_BUILD && logger.error("Error while sending envelope:", reason);
          return reason;
        });
      }
      DEBUG_BUILD && logger.error("Transport disabled");
      return resolvedSyncPromise({});
    }
    /* eslint-enable @typescript-eslint/unified-signatures */
    /** Setup integrations for this client. */
    _setupIntegrations() {
      const { integrations } = this._options;
      this._integrations = setupIntegrations(this, integrations);
      afterSetupIntegrations(this, integrations);
    }
    /** Updates existing session based on the provided event */
    _updateSessionFromEvent(session, event) {
      let crashed = event.level === "fatal";
      let errored = false;
      const exceptions = event.exception?.values;
      if (exceptions) {
        errored = true;
        for (const ex of exceptions) {
          const mechanism = ex.mechanism;
          if (mechanism?.handled === false) {
            crashed = true;
            break;
          }
        }
      }
      const sessionNonTerminal = session.status === "ok";
      const shouldUpdateAndSend = sessionNonTerminal && session.errors === 0 || sessionNonTerminal && crashed;
      if (shouldUpdateAndSend) {
        updateSession(session, {
          ...crashed && { status: "crashed" },
          errors: session.errors || Number(errored || crashed)
        });
        this.captureSession(session);
      }
    }
    /**
     * Determine if the client is finished processing. Returns a promise because it will wait `timeout` ms before saying
     * "no" (resolving to `false`) in order to give the client a chance to potentially finish first.
     *
     * @param timeout The time, in ms, after which to resolve to `false` if the client is still busy. Passing `0` (or not
     * passing anything) will make the promise wait as long as it takes for processing to finish before resolving to
     * `true`.
     * @returns A promise which will resolve to `true` if processing is already done or finishes before the timeout, and
     * `false` otherwise
     */
    _isClientDoneProcessing(timeout) {
      return new SyncPromise((resolve) => {
        let ticked = 0;
        const tick = 1;
        const interval = setInterval(() => {
          if (this._numProcessing == 0) {
            clearInterval(interval);
            resolve(true);
          } else {
            ticked += tick;
            if (timeout && ticked >= timeout) {
              clearInterval(interval);
              resolve(false);
            }
          }
        }, tick);
      });
    }
    /** Determines whether this SDK is enabled and a transport is present. */
    _isEnabled() {
      return this.getOptions().enabled !== false && this._transport !== void 0;
    }
    /**
     * Adds common information to events.
     *
     * The information includes release and environment from `options`,
     * breadcrumbs and context (extra, tags and user) from the scope.
     *
     * Information that is already present in the event is never overwritten. For
     * nested objects, such as the context, keys are merged.
     *
     * @param event The original event.
     * @param hint May contain additional information about the original exception.
     * @param currentScope A scope containing event metadata.
     * @returns A new event with more information.
     */
    _prepareEvent(event, hint, currentScope, isolationScope) {
      const options = this.getOptions();
      const integrations = Object.keys(this._integrations);
      if (!hint.integrations && integrations?.length) {
        hint.integrations = integrations;
      }
      this.emit("preprocessEvent", event, hint);
      if (!event.type) {
        isolationScope.setLastEventId(event.event_id || hint.event_id);
      }
      return prepareEvent(options, event, hint, currentScope, this, isolationScope).then((evt) => {
        if (evt === null) {
          return evt;
        }
        this.emit("postprocessEvent", evt, hint);
        evt.contexts = {
          trace: getTraceContextFromScope(currentScope),
          ...evt.contexts
        };
        const dynamicSamplingContext = getDynamicSamplingContextFromScope(this, currentScope);
        evt.sdkProcessingMetadata = {
          dynamicSamplingContext,
          ...evt.sdkProcessingMetadata
        };
        return evt;
      });
    }
    /**
     * Processes the event and logs an error in case of rejection
     * @param event
     * @param hint
     * @param scope
     */
    _captureEvent(event, hint = {}, currentScope = getCurrentScope(), isolationScope = getIsolationScope()) {
      if (DEBUG_BUILD && isErrorEvent2(event)) {
        logger.log(`Captured error event \`${getPossibleEventMessages(event)[0] || "<unknown>"}\``);
      }
      return this._processEvent(event, hint, currentScope, isolationScope).then(
        (finalEvent) => {
          return finalEvent.event_id;
        },
        (reason) => {
          if (DEBUG_BUILD) {
            if (reason instanceof SentryError && reason.logLevel === "log") {
              logger.log(reason.message);
            } else {
              logger.warn(reason);
            }
          }
          return void 0;
        }
      );
    }
    /**
     * Processes an event (either error or message) and sends it to Sentry.
     *
     * This also adds breadcrumbs and context information to the event. However,
     * platform specific meta data (such as the User's IP address) must be added
     * by the SDK implementor.
     *
     *
     * @param event The event to send to Sentry.
     * @param hint May contain additional information about the original exception.
     * @param currentScope A scope containing event metadata.
     * @returns A SyncPromise that resolves with the event or rejects in case event was/will not be send.
     */
    _processEvent(event, hint, currentScope, isolationScope) {
      const options = this.getOptions();
      const { sampleRate } = options;
      const isTransaction = isTransactionEvent(event);
      const isError2 = isErrorEvent2(event);
      const eventType = event.type || "error";
      const beforeSendLabel = `before send for type \`${eventType}\``;
      const parsedSampleRate = typeof sampleRate === "undefined" ? void 0 : parseSampleRate(sampleRate);
      if (isError2 && typeof parsedSampleRate === "number" && Math.random() > parsedSampleRate) {
        this.recordDroppedEvent("sample_rate", "error");
        return rejectedSyncPromise(
          new SentryError(
            `Discarding event because it's not included in the random sample (sampling rate = ${sampleRate})`,
            "log"
          )
        );
      }
      const dataCategory = eventType === "replay_event" ? "replay" : eventType;
      return this._prepareEvent(event, hint, currentScope, isolationScope).then((prepared) => {
        if (prepared === null) {
          this.recordDroppedEvent("event_processor", dataCategory);
          throw new SentryError("An event processor returned `null`, will not send event.", "log");
        }
        const isInternalException = hint.data && hint.data.__sentry__ === true;
        if (isInternalException) {
          return prepared;
        }
        const result = processBeforeSend(this, options, prepared, hint);
        return _validateBeforeSendResult(result, beforeSendLabel);
      }).then((processedEvent) => {
        if (processedEvent === null) {
          this.recordDroppedEvent("before_send", dataCategory);
          if (isTransaction) {
            const spans = event.spans || [];
            const spanCount = 1 + spans.length;
            this.recordDroppedEvent("before_send", "span", spanCount);
          }
          throw new SentryError(`${beforeSendLabel} returned \`null\`, will not send event.`, "log");
        }
        const session = currentScope.getSession() || isolationScope.getSession();
        if (isError2 && session) {
          this._updateSessionFromEvent(session, processedEvent);
        }
        if (isTransaction) {
          const spanCountBefore = processedEvent.sdkProcessingMetadata?.spanCountBeforeProcessing || 0;
          const spanCountAfter = processedEvent.spans ? processedEvent.spans.length : 0;
          const droppedSpanCount = spanCountBefore - spanCountAfter;
          if (droppedSpanCount > 0) {
            this.recordDroppedEvent("before_send", "span", droppedSpanCount);
          }
        }
        const transactionInfo = processedEvent.transaction_info;
        if (isTransaction && transactionInfo && processedEvent.transaction !== event.transaction) {
          const source = "custom";
          processedEvent.transaction_info = {
            ...transactionInfo,
            source
          };
        }
        this.sendEvent(processedEvent, hint);
        return processedEvent;
      }).then(null, (reason) => {
        if (reason instanceof SentryError) {
          throw reason;
        }
        this.captureException(reason, {
          data: {
            __sentry__: true
          },
          originalException: reason
        });
        throw new SentryError(
          `Event processing pipeline threw an error, original event will not be sent. Details have been sent as a new event.
Reason: ${reason}`
        );
      });
    }
    /**
     * Occupies the client with processing and event
     */
    _process(promise) {
      this._numProcessing++;
      void promise.then(
        (value) => {
          this._numProcessing--;
          return value;
        },
        (reason) => {
          this._numProcessing--;
          return reason;
        }
      );
    }
    /**
     * Clears outcomes on this client and returns them.
     */
    _clearOutcomes() {
      const outcomes = this._outcomes;
      this._outcomes = {};
      return Object.entries(outcomes).map(([key, quantity]) => {
        const [reason, category] = key.split(":");
        return {
          reason,
          category,
          quantity
        };
      });
    }
    /**
     * Sends client reports as an envelope.
     */
    _flushOutcomes() {
      DEBUG_BUILD && logger.log("Flushing outcomes...");
      const outcomes = this._clearOutcomes();
      if (outcomes.length === 0) {
        DEBUG_BUILD && logger.log("No outcomes to send");
        return;
      }
      if (!this._dsn) {
        DEBUG_BUILD && logger.log("No dsn provided, will not send outcomes");
        return;
      }
      DEBUG_BUILD && logger.log("Sending outcomes:", outcomes);
      const envelope = createClientReportEnvelope(outcomes, this._options.tunnel && dsnToString(this._dsn));
      this.sendEnvelope(envelope);
    }
    /**
     * Creates an {@link Event} from all inputs to `captureException` and non-primitive inputs to `captureMessage`.
     */
  };
  function _validateBeforeSendResult(beforeSendResult, beforeSendLabel) {
    const invalidValueError = `${beforeSendLabel} must return \`null\` or a valid event.`;
    if (isThenable(beforeSendResult)) {
      return beforeSendResult.then(
        (event) => {
          if (!isPlainObject(event) && event !== null) {
            throw new SentryError(invalidValueError);
          }
          return event;
        },
        (e) => {
          throw new SentryError(`${beforeSendLabel} rejected with ${e}`);
        }
      );
    } else if (!isPlainObject(beforeSendResult) && beforeSendResult !== null) {
      throw new SentryError(invalidValueError);
    }
    return beforeSendResult;
  }
  function processBeforeSend(client, options, event, hint) {
    const { beforeSend, beforeSendTransaction, beforeSendSpan } = options;
    let processedEvent = event;
    if (isErrorEvent2(processedEvent) && beforeSend) {
      return beforeSend(processedEvent, hint);
    }
    if (isTransactionEvent(processedEvent)) {
      if (beforeSendSpan) {
        const processedRootSpanJson = beforeSendSpan(convertTransactionEventToSpanJson(processedEvent));
        if (!processedRootSpanJson) {
          showSpanDropWarning();
        } else {
          processedEvent = merge(event, convertSpanJsonToTransactionEvent(processedRootSpanJson));
        }
        if (processedEvent.spans) {
          const processedSpans = [];
          for (const span of processedEvent.spans) {
            const processedSpan = beforeSendSpan(span);
            if (!processedSpan) {
              showSpanDropWarning();
              processedSpans.push(span);
            } else {
              processedSpans.push(processedSpan);
            }
          }
          processedEvent.spans = processedSpans;
        }
      }
      if (beforeSendTransaction) {
        if (processedEvent.spans) {
          const spanCountBefore = processedEvent.spans.length;
          processedEvent.sdkProcessingMetadata = {
            ...event.sdkProcessingMetadata,
            spanCountBeforeProcessing: spanCountBefore
          };
        }
        return beforeSendTransaction(processedEvent, hint);
      }
    }
    return processedEvent;
  }
  function isErrorEvent2(event) {
    return event.type === void 0;
  }
  function isTransactionEvent(event) {
    return event.type === "transaction";
  }

  // ../../node_modules/@sentry/core/build/esm/sdk.js
  function initAndBind(clientClass, options) {
    if (options.debug === true) {
      if (DEBUG_BUILD) {
        logger.enable();
      } else {
        consoleSandbox(() => {
          console.warn("[Sentry] Cannot initialize SDK with `debug` option using a non-debug bundle.");
        });
      }
    }
    const scope = getCurrentScope();
    scope.update(options.initialScope);
    const client = new clientClass(options);
    setCurrentClient(client);
    client.init();
    return client;
  }
  function setCurrentClient(client) {
    getCurrentScope().setClient(client);
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/promisebuffer.js
  function makePromiseBuffer(limit) {
    const buffer = [];
    function isReady() {
      return limit === void 0 || buffer.length < limit;
    }
    function remove(task) {
      return buffer.splice(buffer.indexOf(task), 1)[0] || Promise.resolve(void 0);
    }
    function add(taskProducer) {
      if (!isReady()) {
        return rejectedSyncPromise(new SentryError("Not adding Promise because buffer limit was reached."));
      }
      const task = taskProducer();
      if (buffer.indexOf(task) === -1) {
        buffer.push(task);
      }
      void task.then(() => remove(task)).then(
        null,
        () => remove(task).then(null, () => {
        })
      );
      return task;
    }
    function drain(timeout) {
      return new SyncPromise((resolve, reject) => {
        let counter = buffer.length;
        if (!counter) {
          return resolve(true);
        }
        const capturedSetTimeout = setTimeout(() => {
          if (timeout && timeout > 0) {
            resolve(false);
          }
        }, timeout);
        buffer.forEach((item) => {
          void resolvedSyncPromise(item).then(() => {
            if (!--counter) {
              clearTimeout(capturedSetTimeout);
              resolve(true);
            }
          }, reject);
        });
      });
    }
    return {
      $: buffer,
      add,
      drain
    };
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/ratelimit.js
  var DEFAULT_RETRY_AFTER = 60 * 1e3;
  function parseRetryAfterHeader(header, now = Date.now()) {
    const headerDelay = parseInt(`${header}`, 10);
    if (!isNaN(headerDelay)) {
      return headerDelay * 1e3;
    }
    const headerDate = Date.parse(`${header}`);
    if (!isNaN(headerDate)) {
      return headerDate - now;
    }
    return DEFAULT_RETRY_AFTER;
  }
  function disabledUntil(limits, dataCategory) {
    return limits[dataCategory] || limits.all || 0;
  }
  function isRateLimited(limits, dataCategory, now = Date.now()) {
    return disabledUntil(limits, dataCategory) > now;
  }
  function updateRateLimits(limits, { statusCode, headers }, now = Date.now()) {
    const updatedRateLimits = {
      ...limits
    };
    const rateLimitHeader = headers?.["x-sentry-rate-limits"];
    const retryAfterHeader = headers?.["retry-after"];
    if (rateLimitHeader) {
      for (const limit of rateLimitHeader.trim().split(",")) {
        const [retryAfter, categories, , , namespaces] = limit.split(":", 5);
        const headerDelay = parseInt(retryAfter, 10);
        const delay = (!isNaN(headerDelay) ? headerDelay : 60) * 1e3;
        if (!categories) {
          updatedRateLimits.all = now + delay;
        } else {
          for (const category of categories.split(";")) {
            if (category === "metric_bucket") {
              if (!namespaces || namespaces.split(";").includes("custom")) {
                updatedRateLimits[category] = now + delay;
              }
            } else {
              updatedRateLimits[category] = now + delay;
            }
          }
        }
      }
    } else if (retryAfterHeader) {
      updatedRateLimits.all = now + parseRetryAfterHeader(retryAfterHeader, now);
    } else if (statusCode === 429) {
      updatedRateLimits.all = now + 60 * 1e3;
    }
    return updatedRateLimits;
  }

  // ../../node_modules/@sentry/core/build/esm/transports/base.js
  var DEFAULT_TRANSPORT_BUFFER_SIZE = 64;
  function createTransport(options, makeRequest, buffer = makePromiseBuffer(
    options.bufferSize || DEFAULT_TRANSPORT_BUFFER_SIZE
  )) {
    let rateLimits = {};
    const flush2 = (timeout) => buffer.drain(timeout);
    function send(envelope) {
      const filteredEnvelopeItems = [];
      forEachEnvelopeItem(envelope, (item, type) => {
        const dataCategory = envelopeItemTypeToDataCategory(type);
        if (isRateLimited(rateLimits, dataCategory)) {
          options.recordDroppedEvent("ratelimit_backoff", dataCategory);
        } else {
          filteredEnvelopeItems.push(item);
        }
      });
      if (filteredEnvelopeItems.length === 0) {
        return resolvedSyncPromise({});
      }
      const filteredEnvelope = createEnvelope(envelope[0], filteredEnvelopeItems);
      const recordEnvelopeLoss = (reason) => {
        forEachEnvelopeItem(filteredEnvelope, (item, type) => {
          options.recordDroppedEvent(reason, envelopeItemTypeToDataCategory(type));
        });
      };
      const requestTask = () => makeRequest({ body: serializeEnvelope(filteredEnvelope) }).then(
        (response) => {
          if (response.statusCode !== void 0 && (response.statusCode < 200 || response.statusCode >= 300)) {
            DEBUG_BUILD && logger.warn(`Sentry responded with status code ${response.statusCode} to sent event.`);
          }
          rateLimits = updateRateLimits(rateLimits, response);
          return response;
        },
        (error) => {
          recordEnvelopeLoss("network_error");
          throw error;
        }
      );
      return buffer.add(requestTask).then(
        (result) => result,
        (error) => {
          if (error instanceof SentryError) {
            DEBUG_BUILD && logger.error("Skipped sending event because buffer is full.");
            recordEnvelopeLoss("queue_overflow");
            return resolvedSyncPromise({});
          } else {
            throw error;
          }
        }
      );
    }
    return {
      send,
      flush: flush2
    };
  }

  // ../../node_modules/@sentry/core/build/esm/utils/ipAddress.js
  function addAutoIpAddressToUser(objWithMaybeUser) {
    if (objWithMaybeUser.user?.ip_address === void 0) {
      objWithMaybeUser.user = {
        ...objWithMaybeUser.user,
        ip_address: "{{auto}}"
      };
    }
  }
  function addAutoIpAddressToSession(session) {
    if ("aggregates" in session) {
      if (session.attrs?.["ip_address"] === void 0) {
        session.attrs = {
          ...session.attrs,
          ip_address: "{{auto}}"
        };
      }
    } else {
      if (session.ipAddress === void 0) {
        session.ipAddress = "{{auto}}";
      }
    }
  }

  // ../../node_modules/@sentry/core/build/esm/utils/sdkMetadata.js
  function applySdkMetadata(options, name, names = [name], source = "npm") {
    const metadata = options._metadata || {};
    if (!metadata.sdk) {
      metadata.sdk = {
        name: `sentry.javascript.${name}`,
        packages: names.map((name2) => ({
          name: `${source}:@sentry/${name2}`,
          version: SDK_VERSION
        })),
        version: SDK_VERSION
      };
    }
    options._metadata = metadata;
  }

  // ../../node_modules/@sentry/core/build/esm/utils/traceData.js
  function getTraceData(options = {}) {
    const client = getClient();
    if (!isEnabled() || !client) {
      return {};
    }
    const carrier = getMainCarrier();
    const acs = getAsyncContextStrategy(carrier);
    if (acs.getTraceData) {
      return acs.getTraceData(options);
    }
    const scope = getCurrentScope();
    const span = options.span || getActiveSpan();
    const sentryTrace = span ? spanToTraceHeader(span) : scopeToTraceHeader(scope);
    const dsc = span ? getDynamicSamplingContextFromSpan(span) : getDynamicSamplingContextFromScope(client, scope);
    const baggage = dynamicSamplingContextToSentryBaggageHeader(dsc);
    const isValidSentryTraceHeader = TRACEPARENT_REGEXP.test(sentryTrace);
    if (!isValidSentryTraceHeader) {
      logger.warn("Invalid sentry-trace data. Cannot generate trace data");
      return {};
    }
    return {
      "sentry-trace": sentryTrace,
      baggage
    };
  }
  function scopeToTraceHeader(scope) {
    const { traceId, sampled, propagationSpanId } = scope.getPropagationContext();
    return generateSentryTraceHeader(traceId, propagationSpanId, sampled);
  }

  // ../../node_modules/@sentry/core/build/esm/breadcrumbs.js
  var DEFAULT_BREADCRUMBS = 100;
  function addBreadcrumb(breadcrumb, hint) {
    const client = getClient();
    const isolationScope = getIsolationScope();
    if (!client) return;
    const { beforeBreadcrumb = null, maxBreadcrumbs = DEFAULT_BREADCRUMBS } = client.getOptions();
    if (maxBreadcrumbs <= 0) return;
    const timestamp = dateTimestampInSeconds();
    const mergedBreadcrumb = { timestamp, ...breadcrumb };
    const finalBreadcrumb = beforeBreadcrumb ? consoleSandbox(() => beforeBreadcrumb(mergedBreadcrumb, hint)) : mergedBreadcrumb;
    if (finalBreadcrumb === null) return;
    if (client.emit) {
      client.emit("beforeAddBreadcrumb", finalBreadcrumb, hint);
    }
    isolationScope.addBreadcrumb(finalBreadcrumb, maxBreadcrumbs);
  }

  // ../../node_modules/@sentry/core/build/esm/integrations/functiontostring.js
  var originalFunctionToString;
  var INTEGRATION_NAME = "FunctionToString";
  var SETUP_CLIENTS = /* @__PURE__ */ new WeakMap();
  var _functionToStringIntegration = () => {
    return {
      name: INTEGRATION_NAME,
      setupOnce() {
        originalFunctionToString = Function.prototype.toString;
        try {
          Function.prototype.toString = function(...args) {
            const originalFunction = getOriginalFunction(this);
            const context = SETUP_CLIENTS.has(getClient()) && originalFunction !== void 0 ? originalFunction : this;
            return originalFunctionToString.apply(context, args);
          };
        } catch {
        }
      },
      setup(client) {
        SETUP_CLIENTS.set(client, true);
      }
    };
  };
  var functionToStringIntegration = defineIntegration(_functionToStringIntegration);

  // ../../node_modules/@sentry/core/build/esm/integrations/inboundfilters.js
  var DEFAULT_IGNORE_ERRORS = [
    /^Script error\.?$/,
    /^Javascript error: Script error\.? on line 0$/,
    /^ResizeObserver loop completed with undelivered notifications.$/,
    // The browser logs this when a ResizeObserver handler takes a bit longer. Usually this is not an actual issue though. It indicates slowness.
    /^Cannot redefine property: googletag$/,
    // This is thrown when google tag manager is used in combination with an ad blocker
    /^Can't find variable: gmo$/,
    // Error from Google Search App https://issuetracker.google.com/issues/396043331
    "undefined is not an object (evaluating 'a.L')",
    // Random error that happens but not actionable or noticeable to end-users.
    `can't redefine non-configurable property "solana"`,
    // Probably a browser extension or custom browser (Brave) throwing this error
    "vv().getRestrictions is not a function. (In 'vv().getRestrictions(1,a)', 'vv().getRestrictions' is undefined)",
    // Error thrown by GTM, seemingly not affecting end-users
    "Can't find variable: _AutofillCallbackHandler",
    // Unactionable error in instagram webview https://developers.facebook.com/community/threads/320013549791141/
    /^Non-Error promise rejection captured with value: Object Not Found Matching Id:\d+, MethodName:simulateEvent, ParamCount:\d+$/,
    // unactionable error from CEFSharp, a .NET library that embeds chromium in .NET apps
    /^Java exception was raised during method invocation$/
    // error from Facebook Mobile browser (https://github.com/getsentry/sentry-javascript/issues/15065)
  ];
  var INTEGRATION_NAME2 = "InboundFilters";
  var _inboundFiltersIntegration = (options = {}) => {
    return {
      name: INTEGRATION_NAME2,
      processEvent(event, _hint, client) {
        const clientOptions = client.getOptions();
        const mergedOptions = _mergeOptions(options, clientOptions);
        return _shouldDropEvent(event, mergedOptions) ? null : event;
      }
    };
  };
  var inboundFiltersIntegration = defineIntegration(_inboundFiltersIntegration);
  function _mergeOptions(internalOptions = {}, clientOptions = {}) {
    return {
      allowUrls: [...internalOptions.allowUrls || [], ...clientOptions.allowUrls || []],
      denyUrls: [...internalOptions.denyUrls || [], ...clientOptions.denyUrls || []],
      ignoreErrors: [
        ...internalOptions.ignoreErrors || [],
        ...clientOptions.ignoreErrors || [],
        ...internalOptions.disableErrorDefaults ? [] : DEFAULT_IGNORE_ERRORS
      ],
      ignoreTransactions: [...internalOptions.ignoreTransactions || [], ...clientOptions.ignoreTransactions || []],
      ignoreInternal: internalOptions.ignoreInternal !== void 0 ? internalOptions.ignoreInternal : true
    };
  }
  function _shouldDropEvent(event, options) {
    if (options.ignoreInternal && _isSentryError(event)) {
      DEBUG_BUILD && logger.warn(`Event dropped due to being internal Sentry Error.
Event: ${getEventDescription(event)}`);
      return true;
    }
    if (_isIgnoredError(event, options.ignoreErrors)) {
      DEBUG_BUILD && logger.warn(
        `Event dropped due to being matched by \`ignoreErrors\` option.
Event: ${getEventDescription(event)}`
      );
      return true;
    }
    if (_isUselessError(event)) {
      DEBUG_BUILD && logger.warn(
        `Event dropped due to not having an error message, error type or stacktrace.
Event: ${getEventDescription(
          event
        )}`
      );
      return true;
    }
    if (_isIgnoredTransaction(event, options.ignoreTransactions)) {
      DEBUG_BUILD && logger.warn(
        `Event dropped due to being matched by \`ignoreTransactions\` option.
Event: ${getEventDescription(event)}`
      );
      return true;
    }
    if (_isDeniedUrl(event, options.denyUrls)) {
      DEBUG_BUILD && logger.warn(
        `Event dropped due to being matched by \`denyUrls\` option.
Event: ${getEventDescription(
          event
        )}.
Url: ${_getEventFilterUrl(event)}`
      );
      return true;
    }
    if (!_isAllowedUrl(event, options.allowUrls)) {
      DEBUG_BUILD && logger.warn(
        `Event dropped due to not being matched by \`allowUrls\` option.
Event: ${getEventDescription(
          event
        )}.
Url: ${_getEventFilterUrl(event)}`
      );
      return true;
    }
    return false;
  }
  function _isIgnoredError(event, ignoreErrors) {
    if (event.type || !ignoreErrors || !ignoreErrors.length) {
      return false;
    }
    return getPossibleEventMessages(event).some((message) => stringMatchesSomePattern(message, ignoreErrors));
  }
  function _isIgnoredTransaction(event, ignoreTransactions) {
    if (event.type !== "transaction" || !ignoreTransactions || !ignoreTransactions.length) {
      return false;
    }
    const name = event.transaction;
    return name ? stringMatchesSomePattern(name, ignoreTransactions) : false;
  }
  function _isDeniedUrl(event, denyUrls) {
    if (!denyUrls?.length) {
      return false;
    }
    const url = _getEventFilterUrl(event);
    return !url ? false : stringMatchesSomePattern(url, denyUrls);
  }
  function _isAllowedUrl(event, allowUrls) {
    if (!allowUrls?.length) {
      return true;
    }
    const url = _getEventFilterUrl(event);
    return !url ? true : stringMatchesSomePattern(url, allowUrls);
  }
  function _isSentryError(event) {
    try {
      return event.exception.values[0].type === "SentryError";
    } catch (e) {
    }
    return false;
  }
  function _getLastValidUrl(frames = []) {
    for (let i = frames.length - 1; i >= 0; i--) {
      const frame = frames[i];
      if (frame && frame.filename !== "<anonymous>" && frame.filename !== "[native code]") {
        return frame.filename || null;
      }
    }
    return null;
  }
  function _getEventFilterUrl(event) {
    try {
      let frames;
      try {
        frames = event.exception.values[0].stacktrace.frames;
      } catch (e) {
      }
      return frames ? _getLastValidUrl(frames) : null;
    } catch (oO) {
      DEBUG_BUILD && logger.error(`Cannot extract url for event ${getEventDescription(event)}`);
      return null;
    }
  }
  function _isUselessError(event) {
    if (event.type) {
      return false;
    }
    if (!event.exception?.values?.length) {
      return false;
    }
    return (
      // No top-level message
      !event.message && // There are no exception values that have a stacktrace, a non-generic-Error type or value
      !event.exception.values.some((value) => value.stacktrace || value.type && value.type !== "Error" || value.value)
    );
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/aggregate-errors.js
  function applyAggregateErrorsToEvent(exceptionFromErrorImplementation, parser, maxValueLimit = 250, key, limit, event, hint) {
    if (!event.exception?.values || !hint || !isInstanceOf(hint.originalException, Error)) {
      return;
    }
    const originalException = event.exception.values.length > 0 ? event.exception.values[event.exception.values.length - 1] : void 0;
    if (originalException) {
      event.exception.values = truncateAggregateExceptions(
        aggregateExceptionsFromError(
          exceptionFromErrorImplementation,
          parser,
          limit,
          hint.originalException,
          key,
          event.exception.values,
          originalException,
          0
        ),
        maxValueLimit
      );
    }
  }
  function aggregateExceptionsFromError(exceptionFromErrorImplementation, parser, limit, error, key, prevExceptions, exception, exceptionId) {
    if (prevExceptions.length >= limit + 1) {
      return prevExceptions;
    }
    let newExceptions = [...prevExceptions];
    if (isInstanceOf(error[key], Error)) {
      applyExceptionGroupFieldsForParentException(exception, exceptionId);
      const newException = exceptionFromErrorImplementation(parser, error[key]);
      const newExceptionId = newExceptions.length;
      applyExceptionGroupFieldsForChildException(newException, key, newExceptionId, exceptionId);
      newExceptions = aggregateExceptionsFromError(
        exceptionFromErrorImplementation,
        parser,
        limit,
        error[key],
        key,
        [newException, ...newExceptions],
        newException,
        newExceptionId
      );
    }
    if (Array.isArray(error.errors)) {
      error.errors.forEach((childError, i) => {
        if (isInstanceOf(childError, Error)) {
          applyExceptionGroupFieldsForParentException(exception, exceptionId);
          const newException = exceptionFromErrorImplementation(parser, childError);
          const newExceptionId = newExceptions.length;
          applyExceptionGroupFieldsForChildException(newException, `errors[${i}]`, newExceptionId, exceptionId);
          newExceptions = aggregateExceptionsFromError(
            exceptionFromErrorImplementation,
            parser,
            limit,
            childError,
            key,
            [newException, ...newExceptions],
            newException,
            newExceptionId
          );
        }
      });
    }
    return newExceptions;
  }
  function applyExceptionGroupFieldsForParentException(exception, exceptionId) {
    exception.mechanism = exception.mechanism || { type: "generic", handled: true };
    exception.mechanism = {
      ...exception.mechanism,
      ...exception.type === "AggregateError" && { is_exception_group: true },
      exception_id: exceptionId
    };
  }
  function applyExceptionGroupFieldsForChildException(exception, source, exceptionId, parentId) {
    exception.mechanism = exception.mechanism || { type: "generic", handled: true };
    exception.mechanism = {
      ...exception.mechanism,
      type: "chained",
      source,
      exception_id: exceptionId,
      parent_id: parentId
    };
  }
  function truncateAggregateExceptions(exceptions, maxValueLength) {
    return exceptions.map((exception) => {
      if (exception.value) {
        exception.value = truncate(exception.value, maxValueLength);
      }
      return exception;
    });
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/instrument/console.js
  function addConsoleInstrumentationHandler(handler) {
    const type = "console";
    addHandler(type, handler);
    maybeInstrument(type, instrumentConsole);
  }
  function instrumentConsole() {
    if (!("console" in GLOBAL_OBJ)) {
      return;
    }
    CONSOLE_LEVELS.forEach(function(level) {
      if (!(level in GLOBAL_OBJ.console)) {
        return;
      }
      fill(GLOBAL_OBJ.console, level, function(originalConsoleMethod) {
        originalConsoleMethods[level] = originalConsoleMethod;
        return function(...args) {
          const handlerData = { args, level };
          triggerHandlers("console", handlerData);
          const log = originalConsoleMethods[level];
          log?.apply(GLOBAL_OBJ.console, args);
        };
      });
    });
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/severity.js
  function severityLevelFromString(level) {
    return level === "warn" ? "warning" : ["fatal", "error", "warning", "log", "info", "debug"].includes(level) ? level : "log";
  }

  // ../../node_modules/@sentry/core/build/esm/integrations/dedupe.js
  var INTEGRATION_NAME3 = "Dedupe";
  var _dedupeIntegration = () => {
    let previousEvent;
    return {
      name: INTEGRATION_NAME3,
      processEvent(currentEvent) {
        if (currentEvent.type) {
          return currentEvent;
        }
        try {
          if (_shouldDropEvent2(currentEvent, previousEvent)) {
            DEBUG_BUILD && logger.warn("Event dropped due to being a duplicate of previously captured event.");
            return null;
          }
        } catch (_oO) {
        }
        return previousEvent = currentEvent;
      }
    };
  };
  var dedupeIntegration = defineIntegration(_dedupeIntegration);
  function _shouldDropEvent2(currentEvent, previousEvent) {
    if (!previousEvent) {
      return false;
    }
    if (_isSameMessageEvent(currentEvent, previousEvent)) {
      return true;
    }
    if (_isSameExceptionEvent(currentEvent, previousEvent)) {
      return true;
    }
    return false;
  }
  function _isSameMessageEvent(currentEvent, previousEvent) {
    const currentMessage = currentEvent.message;
    const previousMessage = previousEvent.message;
    if (!currentMessage && !previousMessage) {
      return false;
    }
    if (currentMessage && !previousMessage || !currentMessage && previousMessage) {
      return false;
    }
    if (currentMessage !== previousMessage) {
      return false;
    }
    if (!_isSameFingerprint(currentEvent, previousEvent)) {
      return false;
    }
    if (!_isSameStacktrace(currentEvent, previousEvent)) {
      return false;
    }
    return true;
  }
  function _isSameExceptionEvent(currentEvent, previousEvent) {
    const previousException = _getExceptionFromEvent(previousEvent);
    const currentException = _getExceptionFromEvent(currentEvent);
    if (!previousException || !currentException) {
      return false;
    }
    if (previousException.type !== currentException.type || previousException.value !== currentException.value) {
      return false;
    }
    if (!_isSameFingerprint(currentEvent, previousEvent)) {
      return false;
    }
    if (!_isSameStacktrace(currentEvent, previousEvent)) {
      return false;
    }
    return true;
  }
  function _isSameStacktrace(currentEvent, previousEvent) {
    let currentFrames = getFramesFromEvent(currentEvent);
    let previousFrames = getFramesFromEvent(previousEvent);
    if (!currentFrames && !previousFrames) {
      return true;
    }
    if (currentFrames && !previousFrames || !currentFrames && previousFrames) {
      return false;
    }
    currentFrames = currentFrames;
    previousFrames = previousFrames;
    if (previousFrames.length !== currentFrames.length) {
      return false;
    }
    for (let i = 0; i < previousFrames.length; i++) {
      const frameA = previousFrames[i];
      const frameB = currentFrames[i];
      if (frameA.filename !== frameB.filename || frameA.lineno !== frameB.lineno || frameA.colno !== frameB.colno || frameA.function !== frameB.function) {
        return false;
      }
    }
    return true;
  }
  function _isSameFingerprint(currentEvent, previousEvent) {
    let currentFingerprint = currentEvent.fingerprint;
    let previousFingerprint = previousEvent.fingerprint;
    if (!currentFingerprint && !previousFingerprint) {
      return true;
    }
    if (currentFingerprint && !previousFingerprint || !currentFingerprint && previousFingerprint) {
      return false;
    }
    currentFingerprint = currentFingerprint;
    previousFingerprint = previousFingerprint;
    try {
      return !!(currentFingerprint.join("") === previousFingerprint.join(""));
    } catch (_oO) {
      return false;
    }
  }
  function _getExceptionFromEvent(event) {
    return event.exception?.values && event.exception.values[0];
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/url.js
  function parseUrl(url) {
    if (!url) {
      return {};
    }
    const match = url.match(/^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/);
    if (!match) {
      return {};
    }
    const query = match[6] || "";
    const fragment = match[8] || "";
    return {
      host: match[4],
      path: match[5],
      protocol: match[2],
      search: query,
      hash: fragment,
      relative: match[5] + query + fragment
      // everything minus origin
    };
  }
  function stripUrlQueryAndFragment(urlPath) {
    return urlPath.split(/[?#]/, 1)[0];
  }

  // ../../node_modules/@sentry/core/build/esm/fetch.js
  function instrumentFetchRequest(handlerData, shouldCreateSpan, shouldAttachHeaders2, spans, spanOrigin = "auto.http.browser") {
    if (!handlerData.fetchData) {
      return void 0;
    }
    const { method, url } = handlerData.fetchData;
    const shouldCreateSpanResult = hasSpansEnabled() && shouldCreateSpan(url);
    if (handlerData.endTimestamp && shouldCreateSpanResult) {
      const spanId = handlerData.fetchData.__span;
      if (!spanId) return;
      const span2 = spans[spanId];
      if (span2) {
        endSpan(span2, handlerData);
        delete spans[spanId];
      }
      return void 0;
    }
    const fullUrl = getFullURL(url);
    const parsedUrl = fullUrl ? parseUrl(fullUrl) : parseUrl(url);
    const hasParent = !!getActiveSpan();
    const span = shouldCreateSpanResult && hasParent ? startInactiveSpan({
      name: `${method} ${stripUrlQueryAndFragment(url)}`,
      attributes: {
        url,
        type: "fetch",
        "http.method": method,
        "http.url": fullUrl,
        "server.address": parsedUrl?.host,
        [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: spanOrigin,
        [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "http.client",
        ...parsedUrl?.search && { "http.query": parsedUrl?.search },
        ...parsedUrl?.hash && { "http.fragment": parsedUrl?.hash }
      }
    }) : new SentryNonRecordingSpan();
    handlerData.fetchData.__span = span.spanContext().spanId;
    spans[span.spanContext().spanId] = span;
    if (shouldAttachHeaders2(handlerData.fetchData.url)) {
      const request = handlerData.args[0];
      const options = handlerData.args[1] || {};
      const headers = _addTracingHeadersToFetchRequest(
        request,
        options,
        // If performance is disabled (TWP) or there's no active root span (pageload/navigation/interaction),
        // we do not want to use the span as base for the trace headers,
        // which means that the headers will be generated from the scope and the sampling decision is deferred
        hasSpansEnabled() && hasParent ? span : void 0
      );
      if (headers) {
        handlerData.args[1] = options;
        options.headers = headers;
      }
    }
    const client = getClient();
    if (client) {
      const fetchHint = {
        input: handlerData.args,
        response: handlerData.response,
        startTimestamp: handlerData.startTimestamp,
        endTimestamp: handlerData.endTimestamp
      };
      client.emit("beforeOutgoingRequestSpan", span, fetchHint);
    }
    return span;
  }
  function _addTracingHeadersToFetchRequest(request, fetchOptionsObj, span) {
    const traceHeaders = getTraceData({ span });
    const sentryTrace = traceHeaders["sentry-trace"];
    const baggage = traceHeaders.baggage;
    if (!sentryTrace) {
      return void 0;
    }
    const headers = fetchOptionsObj.headers || (isRequest(request) ? request.headers : void 0);
    if (!headers) {
      return { ...traceHeaders };
    } else if (isHeaders(headers)) {
      const newHeaders = new Headers(headers);
      newHeaders.set("sentry-trace", sentryTrace);
      if (baggage) {
        const prevBaggageHeader = newHeaders.get("baggage");
        if (prevBaggageHeader) {
          const prevHeaderStrippedFromSentryBaggage = stripBaggageHeaderOfSentryBaggageValues(prevBaggageHeader);
          newHeaders.set(
            "baggage",
            // If there are non-sentry entries (i.e. if the stripped string is non-empty/truthy) combine the stripped header and sentry baggage header
            // otherwise just set the sentry baggage header
            prevHeaderStrippedFromSentryBaggage ? `${prevHeaderStrippedFromSentryBaggage},${baggage}` : baggage
          );
        } else {
          newHeaders.set("baggage", baggage);
        }
      }
      return newHeaders;
    } else if (Array.isArray(headers)) {
      const newHeaders = [
        ...headers.filter((header) => {
          return !(Array.isArray(header) && header[0] === "sentry-trace");
        }).map((header) => {
          if (Array.isArray(header) && header[0] === "baggage" && typeof header[1] === "string") {
            const [headerName, headerValue, ...rest] = header;
            return [headerName, stripBaggageHeaderOfSentryBaggageValues(headerValue), ...rest];
          } else {
            return header;
          }
        }),
        // Attach the new sentry-trace header
        ["sentry-trace", sentryTrace]
      ];
      if (baggage) {
        newHeaders.push(["baggage", baggage]);
      }
      return newHeaders;
    } else {
      const existingBaggageHeader = "baggage" in headers ? headers.baggage : void 0;
      let newBaggageHeaders = [];
      if (Array.isArray(existingBaggageHeader)) {
        newBaggageHeaders = existingBaggageHeader.map(
          (headerItem) => typeof headerItem === "string" ? stripBaggageHeaderOfSentryBaggageValues(headerItem) : headerItem
        ).filter((headerItem) => headerItem === "");
      } else if (existingBaggageHeader) {
        newBaggageHeaders.push(stripBaggageHeaderOfSentryBaggageValues(existingBaggageHeader));
      }
      if (baggage) {
        newBaggageHeaders.push(baggage);
      }
      return {
        ...headers,
        "sentry-trace": sentryTrace,
        baggage: newBaggageHeaders.length > 0 ? newBaggageHeaders.join(",") : void 0
      };
    }
  }
  function getFullURL(url) {
    try {
      const parsed = new URL(url);
      return parsed.href;
    } catch {
      return void 0;
    }
  }
  function endSpan(span, handlerData) {
    if (handlerData.response) {
      setHttpStatus(span, handlerData.response.status);
      const contentLength = handlerData.response?.headers && handlerData.response.headers.get("content-length");
      if (contentLength) {
        const contentLengthNum = parseInt(contentLength);
        if (contentLengthNum > 0) {
          span.setAttribute("http.response_content_length", contentLengthNum);
        }
      }
    } else if (handlerData.error) {
      span.setStatus({ code: SPAN_STATUS_ERROR, message: "internal_error" });
    }
    span.end();
  }
  function stripBaggageHeaderOfSentryBaggageValues(baggageHeader) {
    return baggageHeader.split(",").filter((baggageEntry) => !baggageEntry.split("=")[0].startsWith(SENTRY_BAGGAGE_KEY_PREFIX)).join(",");
  }
  function isRequest(request) {
    return typeof Request !== "undefined" && isInstanceOf(request, Request);
  }
  function isHeaders(headers) {
    return typeof Headers !== "undefined" && isInstanceOf(headers, Headers);
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/breadcrumb-log-level.js
  function getBreadcrumbLogLevelFromHttpStatusCode(statusCode) {
    if (statusCode === void 0) {
      return void 0;
    } else if (statusCode >= 400 && statusCode < 500) {
      return "warning";
    } else if (statusCode >= 500) {
      return "error";
    } else {
      return void 0;
    }
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/supports.js
  var WINDOW2 = GLOBAL_OBJ;
  function supportsHistory() {
    return "history" in WINDOW2;
  }
  function supportsFetch() {
    if (!("fetch" in WINDOW2)) {
      return false;
    }
    try {
      new Headers();
      new Request("http://www.example.com");
      new Response();
      return true;
    } catch (e) {
      return false;
    }
  }
  function isNativeFunction(func) {
    return func && /^function\s+\w+\(\)\s+\{\s+\[native code\]\s+\}$/.test(func.toString());
  }
  function supportsNativeFetch() {
    if (typeof EdgeRuntime === "string") {
      return true;
    }
    if (!supportsFetch()) {
      return false;
    }
    if (isNativeFunction(WINDOW2.fetch)) {
      return true;
    }
    let result = false;
    const doc = WINDOW2.document;
    if (doc && typeof doc.createElement === "function") {
      try {
        const sandbox = doc.createElement("iframe");
        sandbox.hidden = true;
        doc.head.appendChild(sandbox);
        if (sandbox.contentWindow?.fetch) {
          result = isNativeFunction(sandbox.contentWindow.fetch);
        }
        doc.head.removeChild(sandbox);
      } catch (err) {
        DEBUG_BUILD2 && logger.warn("Could not create sandbox iframe for pure fetch check, bailing to window.fetch: ", err);
      }
    }
    return result;
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/instrument/fetch.js
  function addFetchInstrumentationHandler(handler, skipNativeFetchCheck) {
    const type = "fetch";
    addHandler(type, handler);
    maybeInstrument(type, () => instrumentFetch(void 0, skipNativeFetchCheck));
  }
  function addFetchEndInstrumentationHandler(handler) {
    const type = "fetch-body-resolved";
    addHandler(type, handler);
    maybeInstrument(type, () => instrumentFetch(streamHandler));
  }
  function instrumentFetch(onFetchResolved, skipNativeFetchCheck = false) {
    if (skipNativeFetchCheck && !supportsNativeFetch()) {
      return;
    }
    fill(GLOBAL_OBJ, "fetch", function(originalFetch) {
      return function(...args) {
        const virtualError = new Error();
        const { method, url } = parseFetchArgs(args);
        const handlerData = {
          args,
          fetchData: {
            method,
            url
          },
          startTimestamp: timestampInSeconds() * 1e3,
          // // Adding the error to be able to fingerprint the failed fetch event in HttpClient instrumentation
          virtualError
        };
        if (!onFetchResolved) {
          triggerHandlers("fetch", {
            ...handlerData
          });
        }
        return originalFetch.apply(GLOBAL_OBJ, args).then(
          async (response) => {
            if (onFetchResolved) {
              onFetchResolved(response);
            } else {
              triggerHandlers("fetch", {
                ...handlerData,
                endTimestamp: timestampInSeconds() * 1e3,
                response
              });
            }
            return response;
          },
          (error) => {
            triggerHandlers("fetch", {
              ...handlerData,
              endTimestamp: timestampInSeconds() * 1e3,
              error
            });
            if (isError(error) && error.stack === void 0) {
              error.stack = virtualError.stack;
              addNonEnumerableProperty(error, "framesToPop", 1);
            }
            throw error;
          }
        );
      };
    });
  }
  async function resolveResponse(res, onFinishedResolving) {
    if (res?.body) {
      const body = res.body;
      const responseReader = body.getReader();
      const maxFetchDurationTimeout = setTimeout(
        () => {
          body.cancel().then(null, () => {
          });
        },
        90 * 1e3
        // 90s
      );
      let readingActive = true;
      while (readingActive) {
        let chunkTimeout;
        try {
          chunkTimeout = setTimeout(() => {
            body.cancel().then(null, () => {
            });
          }, 5e3);
          const { done } = await responseReader.read();
          clearTimeout(chunkTimeout);
          if (done) {
            onFinishedResolving();
            readingActive = false;
          }
        } catch (error) {
          readingActive = false;
        } finally {
          clearTimeout(chunkTimeout);
        }
      }
      clearTimeout(maxFetchDurationTimeout);
      responseReader.releaseLock();
      body.cancel().then(null, () => {
      });
    }
  }
  function streamHandler(response) {
    let clonedResponseForResolving;
    try {
      clonedResponseForResolving = response.clone();
    } catch {
      return;
    }
    resolveResponse(clonedResponseForResolving, () => {
      triggerHandlers("fetch-body-resolved", {
        endTimestamp: timestampInSeconds() * 1e3,
        response
      });
    });
  }
  function hasProp(obj, prop) {
    return !!obj && typeof obj === "object" && !!obj[prop];
  }
  function getUrlFromResource(resource) {
    if (typeof resource === "string") {
      return resource;
    }
    if (!resource) {
      return "";
    }
    if (hasProp(resource, "url")) {
      return resource.url;
    }
    if (resource.toString) {
      return resource.toString();
    }
    return "";
  }
  function parseFetchArgs(fetchArgs) {
    if (fetchArgs.length === 0) {
      return { method: "GET", url: "" };
    }
    if (fetchArgs.length === 2) {
      const [url, options] = fetchArgs;
      return {
        url: getUrlFromResource(url),
        method: hasProp(options, "method") ? String(options.method).toUpperCase() : "GET"
      };
    }
    const arg = fetchArgs[0];
    return {
      url: getUrlFromResource(arg),
      method: hasProp(arg, "method") ? String(arg.method).toUpperCase() : "GET"
    };
  }

  // ../../node_modules/@sentry/core/build/esm/utils-hoist/env.js
  function getSDKSource() {
    return "npm";
  }

  // ../../node_modules/@sentry/browser/build/npm/esm/helpers.js
  var WINDOW3 = GLOBAL_OBJ;
  var ignoreOnError = 0;
  function shouldIgnoreOnError() {
    return ignoreOnError > 0;
  }
  function ignoreNextOnError() {
    ignoreOnError++;
    setTimeout(() => {
      ignoreOnError--;
    });
  }
  function wrap(fn, options = {}) {
    function isFunction(fn2) {
      return typeof fn2 === "function";
    }
    if (!isFunction(fn)) {
      return fn;
    }
    try {
      const wrapper = fn.__sentry_wrapped__;
      if (wrapper) {
        if (typeof wrapper === "function") {
          return wrapper;
        } else {
          return fn;
        }
      }
      if (getOriginalFunction(fn)) {
        return fn;
      }
    } catch (e) {
      return fn;
    }
    const sentryWrapped = function(...args) {
      try {
        const wrappedArguments = args.map((arg) => wrap(arg, options));
        return fn.apply(this, wrappedArguments);
      } catch (ex) {
        ignoreNextOnError();
        withScope2((scope) => {
          scope.addEventProcessor((event) => {
            if (options.mechanism) {
              addExceptionTypeValue(event, void 0, void 0);
              addExceptionMechanism(event, options.mechanism);
            }
            event.extra = {
              ...event.extra,
              arguments: args
            };
            return event;
          });
          captureException(ex);
        });
        throw ex;
      }
    };
    try {
      for (const property in fn) {
        if (Object.prototype.hasOwnProperty.call(fn, property)) {
          sentryWrapped[property] = fn[property];
        }
      }
    } catch {
    }
    markFunctionWrapped(sentryWrapped, fn);
    addNonEnumerableProperty(fn, "__sentry_wrapped__", sentryWrapped);
    try {
      const descriptor = Object.getOwnPropertyDescriptor(sentryWrapped, "name");
      if (descriptor.configurable) {
        Object.defineProperty(sentryWrapped, "name", {
          get() {
            return fn.name;
          }
        });
      }
    } catch {
    }
    return sentryWrapped;
  }

  // ../../node_modules/@sentry/browser/build/npm/esm/eventbuilder.js
  function exceptionFromError(stackParser, ex) {
    const frames = parseStackFrames(stackParser, ex);
    const exception = {
      type: extractType(ex),
      value: extractMessage(ex)
    };
    if (frames.length) {
      exception.stacktrace = { frames };
    }
    if (exception.type === void 0 && exception.value === "") {
      exception.value = "Unrecoverable error caught";
    }
    return exception;
  }
  function eventFromPlainObject(stackParser, exception, syntheticException, isUnhandledRejection) {
    const client = getClient();
    const normalizeDepth = client?.getOptions().normalizeDepth;
    const errorFromProp = getErrorPropertyFromObject(exception);
    const extra = {
      __serialized__: normalizeToSize(exception, normalizeDepth)
    };
    if (errorFromProp) {
      return {
        exception: {
          values: [exceptionFromError(stackParser, errorFromProp)]
        },
        extra
      };
    }
    const event = {
      exception: {
        values: [
          {
            type: isEvent(exception) ? exception.constructor.name : isUnhandledRejection ? "UnhandledRejection" : "Error",
            value: getNonErrorObjectExceptionValue(exception, { isUnhandledRejection })
          }
        ]
      },
      extra
    };
    if (syntheticException) {
      const frames = parseStackFrames(stackParser, syntheticException);
      if (frames.length) {
        event.exception.values[0].stacktrace = { frames };
      }
    }
    return event;
  }
  function eventFromError(stackParser, ex) {
    return {
      exception: {
        values: [exceptionFromError(stackParser, ex)]
      }
    };
  }
  function parseStackFrames(stackParser, ex) {
    const stacktrace = ex.stacktrace || ex.stack || "";
    const skipLines = getSkipFirstStackStringLines(ex);
    const framesToPop = getPopFirstTopFrames(ex);
    try {
      return stackParser(stacktrace, skipLines, framesToPop);
    } catch (e) {
    }
    return [];
  }
  var reactMinifiedRegexp = /Minified React error #\d+;/i;
  function getSkipFirstStackStringLines(ex) {
    if (ex && reactMinifiedRegexp.test(ex.message)) {
      return 1;
    }
    return 0;
  }
  function getPopFirstTopFrames(ex) {
    if (typeof ex.framesToPop === "number") {
      return ex.framesToPop;
    }
    return 0;
  }
  function isWebAssemblyException(exception) {
    if (typeof WebAssembly !== "undefined" && typeof WebAssembly.Exception !== "undefined") {
      return exception instanceof WebAssembly.Exception;
    } else {
      return false;
    }
  }
  function extractType(ex) {
    const name = ex?.name;
    if (!name && isWebAssemblyException(ex)) {
      const hasTypeInMessage = ex.message && Array.isArray(ex.message) && ex.message.length == 2;
      return hasTypeInMessage ? ex.message[0] : "WebAssembly.Exception";
    }
    return name;
  }
  function extractMessage(ex) {
    const message = ex?.message;
    if (isWebAssemblyException(ex)) {
      if (Array.isArray(ex.message) && ex.message.length == 2) {
        return ex.message[1];
      }
      return "wasm exception";
    }
    if (!message) {
      return "No error message";
    }
    if (message.error && typeof message.error.message === "string") {
      return message.error.message;
    }
    return message;
  }
  function eventFromException(stackParser, exception, hint, attachStacktrace) {
    const syntheticException = hint?.syntheticException || void 0;
    const event = eventFromUnknownInput(stackParser, exception, syntheticException, attachStacktrace);
    addExceptionMechanism(event);
    event.level = "error";
    if (hint?.event_id) {
      event.event_id = hint.event_id;
    }
    return resolvedSyncPromise(event);
  }
  function eventFromMessage(stackParser, message, level = "info", hint, attachStacktrace) {
    const syntheticException = hint?.syntheticException || void 0;
    const event = eventFromString(stackParser, message, syntheticException, attachStacktrace);
    event.level = level;
    if (hint?.event_id) {
      event.event_id = hint.event_id;
    }
    return resolvedSyncPromise(event);
  }
  function eventFromUnknownInput(stackParser, exception, syntheticException, attachStacktrace, isUnhandledRejection) {
    let event;
    if (isErrorEvent(exception) && exception.error) {
      const errorEvent = exception;
      return eventFromError(stackParser, errorEvent.error);
    }
    if (isDOMError(exception) || isDOMException(exception)) {
      const domException = exception;
      if ("stack" in exception) {
        event = eventFromError(stackParser, exception);
      } else {
        const name = domException.name || (isDOMError(domException) ? "DOMError" : "DOMException");
        const message = domException.message ? `${name}: ${domException.message}` : name;
        event = eventFromString(stackParser, message, syntheticException, attachStacktrace);
        addExceptionTypeValue(event, message);
      }
      if ("code" in domException) {
        event.tags = { ...event.tags, "DOMException.code": `${domException.code}` };
      }
      return event;
    }
    if (isError(exception)) {
      return eventFromError(stackParser, exception);
    }
    if (isPlainObject(exception) || isEvent(exception)) {
      const objectException = exception;
      event = eventFromPlainObject(stackParser, objectException, syntheticException, isUnhandledRejection);
      addExceptionMechanism(event, {
        synthetic: true
      });
      return event;
    }
    event = eventFromString(stackParser, exception, syntheticException, attachStacktrace);
    addExceptionTypeValue(event, `${exception}`, void 0);
    addExceptionMechanism(event, {
      synthetic: true
    });
    return event;
  }
  function eventFromString(stackParser, message, syntheticException, attachStacktrace) {
    const event = {};
    if (attachStacktrace && syntheticException) {
      const frames = parseStackFrames(stackParser, syntheticException);
      if (frames.length) {
        event.exception = {
          values: [{ value: message, stacktrace: { frames } }]
        };
      }
      addExceptionMechanism(event, { synthetic: true });
    }
    if (isParameterizedString(message)) {
      const { __sentry_template_string__, __sentry_template_values__ } = message;
      event.logentry = {
        message: __sentry_template_string__,
        params: __sentry_template_values__
      };
      return event;
    }
    event.message = message;
    return event;
  }
  function getNonErrorObjectExceptionValue(exception, { isUnhandledRejection }) {
    const keys = extractExceptionKeysForMessage(exception);
    const captureType = isUnhandledRejection ? "promise rejection" : "exception";
    if (isErrorEvent(exception)) {
      return `Event \`ErrorEvent\` captured as ${captureType} with message \`${exception.message}\``;
    }
    if (isEvent(exception)) {
      const className = getObjectClassName(exception);
      return `Event \`${className}\` (type=${exception.type}) captured as ${captureType}`;
    }
    return `Object captured as ${captureType} with keys: ${keys}`;
  }
  function getObjectClassName(obj) {
    try {
      const prototype = Object.getPrototypeOf(obj);
      return prototype ? prototype.constructor.name : void 0;
    } catch (e) {
    }
  }
  function getErrorPropertyFromObject(obj) {
    for (const prop in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, prop)) {
        const value = obj[prop];
        if (value instanceof Error) {
          return value;
        }
      }
    }
    return void 0;
  }

  // ../../node_modules/@sentry/browser/build/npm/esm/client.js
  var BrowserClient = class extends Client {
    /**
     * Creates a new Browser SDK instance.
     *
     * @param options Configuration options for this SDK.
     */
    constructor(options) {
      const opts = {
        // We default this to true, as it is the safer scenario
        parentSpanIsAlwaysRootSpan: true,
        ...options
      };
      const sdkSource = WINDOW3.SENTRY_SDK_SOURCE || getSDKSource();
      applySdkMetadata(opts, "browser", ["browser"], sdkSource);
      super(opts);
      if (opts.sendClientReports && WINDOW3.document) {
        WINDOW3.document.addEventListener("visibilitychange", () => {
          if (WINDOW3.document.visibilityState === "hidden") {
            this._flushOutcomes();
          }
        });
      }
      if (this._options.sendDefaultPii) {
        this.on("postprocessEvent", addAutoIpAddressToUser);
        this.on("beforeSendSession", addAutoIpAddressToSession);
      }
    }
    /**
     * @inheritDoc
     */
    eventFromException(exception, hint) {
      return eventFromException(this._options.stackParser, exception, hint, this._options.attachStacktrace);
    }
    /**
     * @inheritDoc
     */
    eventFromMessage(message, level = "info", hint) {
      return eventFromMessage(this._options.stackParser, message, level, hint, this._options.attachStacktrace);
    }
    /**
     * @inheritDoc
     */
    _prepareEvent(event, hint, currentScope, isolationScope) {
      event.platform = event.platform || "javascript";
      return super._prepareEvent(event, hint, currentScope, isolationScope);
    }
  };

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/debug-build.js
  var DEBUG_BUILD3 = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/web-vitals/lib/bindReporter.js
  var getRating = (value, thresholds) => {
    if (value > thresholds[1]) {
      return "poor";
    }
    if (value > thresholds[0]) {
      return "needs-improvement";
    }
    return "good";
  };
  var bindReporter = (callback, metric, thresholds, reportAllChanges) => {
    let prevValue;
    let delta;
    return (forceReport) => {
      if (metric.value >= 0) {
        if (forceReport || reportAllChanges) {
          delta = metric.value - (prevValue || 0);
          if (delta || prevValue === void 0) {
            prevValue = metric.value;
            metric.delta = delta;
            metric.rating = getRating(metric.value, thresholds);
            callback(metric);
          }
        }
      }
    };
  };

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/types.js
  var WINDOW4 = GLOBAL_OBJ;

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/web-vitals/lib/generateUniqueID.js
  var generateUniqueID = () => {
    return `v4-${Date.now()}-${Math.floor(Math.random() * (9e12 - 1)) + 1e12}`;
  };

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/web-vitals/lib/getNavigationEntry.js
  var getNavigationEntry = (checkResponseStart = true) => {
    const navigationEntry = WINDOW4.performance?.getEntriesByType?.("navigation")[0];
    if (
      // sentry-specific change:
      // We don't want to check for responseStart for our own use of `getNavigationEntry`
      !checkResponseStart || navigationEntry && navigationEntry.responseStart > 0 && navigationEntry.responseStart < performance.now()
    ) {
      return navigationEntry;
    }
  };

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/web-vitals/lib/getActivationStart.js
  var getActivationStart = () => {
    const navEntry = getNavigationEntry();
    return navEntry?.activationStart || 0;
  };

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/web-vitals/lib/initMetric.js
  var initMetric = (name, value) => {
    const navEntry = getNavigationEntry();
    let navigationType = "navigate";
    if (navEntry) {
      if (WINDOW4.document?.prerendering || getActivationStart() > 0) {
        navigationType = "prerender";
      } else if (WINDOW4.document?.wasDiscarded) {
        navigationType = "restore";
      } else if (navEntry.type) {
        navigationType = navEntry.type.replace(/_/g, "-");
      }
    }
    const entries = [];
    return {
      name,
      value: typeof value === "undefined" ? -1 : value,
      rating: "good",
      // If needed, will be updated when reported. `const` to keep the type from widening to `string`.
      delta: 0,
      entries,
      id: generateUniqueID(),
      navigationType
    };
  };

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/web-vitals/lib/observe.js
  var observe = (type, callback, opts) => {
    try {
      if (PerformanceObserver.supportedEntryTypes.includes(type)) {
        const po2 = new PerformanceObserver((list) => {
          Promise.resolve().then(() => {
            callback(list.getEntries());
          });
        });
        po2.observe(
          Object.assign(
            {
              type,
              buffered: true
            },
            opts || {}
          )
        );
        return po2;
      }
    } catch (e) {
    }
    return;
  };

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/web-vitals/lib/onHidden.js
  var onHidden = (cb) => {
    const onHiddenOrPageHide = (event) => {
      if (event.type === "pagehide" || WINDOW4.document?.visibilityState === "hidden") {
        cb(event);
      }
    };
    if (WINDOW4.document) {
      addEventListener("visibilitychange", onHiddenOrPageHide, true);
      addEventListener("pagehide", onHiddenOrPageHide, true);
    }
  };

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/web-vitals/lib/runOnce.js
  var runOnce = (cb) => {
    let called = false;
    return () => {
      if (!called) {
        cb();
        called = true;
      }
    };
  };

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/web-vitals/lib/getVisibilityWatcher.js
  var firstHiddenTime = -1;
  var initHiddenTime = () => {
    return WINDOW4.document.visibilityState === "hidden" && !WINDOW4.document.prerendering ? 0 : Infinity;
  };
  var onVisibilityUpdate = (event) => {
    if (WINDOW4.document.visibilityState === "hidden" && firstHiddenTime > -1) {
      firstHiddenTime = event.type === "visibilitychange" ? event.timeStamp : 0;
      removeChangeListeners();
    }
  };
  var addChangeListeners = () => {
    addEventListener("visibilitychange", onVisibilityUpdate, true);
    addEventListener("prerenderingchange", onVisibilityUpdate, true);
  };
  var removeChangeListeners = () => {
    removeEventListener("visibilitychange", onVisibilityUpdate, true);
    removeEventListener("prerenderingchange", onVisibilityUpdate, true);
  };
  var getVisibilityWatcher = () => {
    if (WINDOW4.document && firstHiddenTime < 0) {
      firstHiddenTime = initHiddenTime();
      addChangeListeners();
    }
    return {
      get firstHiddenTime() {
        return firstHiddenTime;
      }
    };
  };

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/web-vitals/lib/whenActivated.js
  var whenActivated = (callback) => {
    if (WINDOW4.document?.prerendering) {
      addEventListener("prerenderingchange", () => callback(), true);
    } else {
      callback();
    }
  };

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/web-vitals/onFCP.js
  var FCPThresholds = [1800, 3e3];
  var onFCP = (onReport, opts = {}) => {
    whenActivated(() => {
      const visibilityWatcher = getVisibilityWatcher();
      const metric = initMetric("FCP");
      let report;
      const handleEntries = (entries) => {
        entries.forEach((entry) => {
          if (entry.name === "first-contentful-paint") {
            po2.disconnect();
            if (entry.startTime < visibilityWatcher.firstHiddenTime) {
              metric.value = Math.max(entry.startTime - getActivationStart(), 0);
              metric.entries.push(entry);
              report(true);
            }
          }
        });
      };
      const po2 = observe("paint", handleEntries);
      if (po2) {
        report = bindReporter(onReport, metric, FCPThresholds, opts.reportAllChanges);
      }
    });
  };

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/web-vitals/getCLS.js
  var CLSThresholds = [0.1, 0.25];
  var onCLS = (onReport, opts = {}) => {
    onFCP(
      runOnce(() => {
        const metric = initMetric("CLS", 0);
        let report;
        let sessionValue = 0;
        let sessionEntries = [];
        const handleEntries = (entries) => {
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              const firstSessionEntry = sessionEntries[0];
              const lastSessionEntry = sessionEntries[sessionEntries.length - 1];
              if (sessionValue && firstSessionEntry && lastSessionEntry && entry.startTime - lastSessionEntry.startTime < 1e3 && entry.startTime - firstSessionEntry.startTime < 5e3) {
                sessionValue += entry.value;
                sessionEntries.push(entry);
              } else {
                sessionValue = entry.value;
                sessionEntries = [entry];
              }
            }
          });
          if (sessionValue > metric.value) {
            metric.value = sessionValue;
            metric.entries = sessionEntries;
            report();
          }
        };
        const po2 = observe("layout-shift", handleEntries);
        if (po2) {
          report = bindReporter(onReport, metric, CLSThresholds, opts.reportAllChanges);
          onHidden(() => {
            handleEntries(po2.takeRecords());
            report(true);
          });
          setTimeout(report, 0);
        }
      })
    );
  };

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/web-vitals/getFID.js
  var FIDThresholds = [100, 300];
  var onFID = (onReport, opts = {}) => {
    whenActivated(() => {
      const visibilityWatcher = getVisibilityWatcher();
      const metric = initMetric("FID");
      let report;
      const handleEntry = (entry) => {
        if (entry.startTime < visibilityWatcher.firstHiddenTime) {
          metric.value = entry.processingStart - entry.startTime;
          metric.entries.push(entry);
          report(true);
        }
      };
      const handleEntries = (entries) => {
        entries.forEach(handleEntry);
      };
      const po2 = observe("first-input", handleEntries);
      report = bindReporter(onReport, metric, FIDThresholds, opts.reportAllChanges);
      if (po2) {
        onHidden(
          runOnce(() => {
            handleEntries(po2.takeRecords());
            po2.disconnect();
          })
        );
      }
    });
  };

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/web-vitals/lib/polyfills/interactionCountPolyfill.js
  var interactionCountEstimate = 0;
  var minKnownInteractionId = Infinity;
  var maxKnownInteractionId = 0;
  var updateEstimate = (entries) => {
    entries.forEach((e) => {
      if (e.interactionId) {
        minKnownInteractionId = Math.min(minKnownInteractionId, e.interactionId);
        maxKnownInteractionId = Math.max(maxKnownInteractionId, e.interactionId);
        interactionCountEstimate = maxKnownInteractionId ? (maxKnownInteractionId - minKnownInteractionId) / 7 + 1 : 0;
      }
    });
  };
  var po;
  var getInteractionCount = () => {
    return po ? interactionCountEstimate : performance.interactionCount || 0;
  };
  var initInteractionCountPolyfill = () => {
    if ("interactionCount" in performance || po) return;
    po = observe("event", updateEstimate, {
      type: "event",
      buffered: true,
      durationThreshold: 0
    });
  };

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/web-vitals/lib/interactions.js
  var longestInteractionList = [];
  var longestInteractionMap = /* @__PURE__ */ new Map();
  var DEFAULT_DURATION_THRESHOLD = 40;
  var prevInteractionCount = 0;
  var getInteractionCountForNavigation = () => {
    return getInteractionCount() - prevInteractionCount;
  };
  var estimateP98LongestInteraction = () => {
    const candidateInteractionIndex = Math.min(
      longestInteractionList.length - 1,
      Math.floor(getInteractionCountForNavigation() / 50)
    );
    return longestInteractionList[candidateInteractionIndex];
  };
  var MAX_INTERACTIONS_TO_CONSIDER = 10;
  var entryPreProcessingCallbacks = [];
  var processInteractionEntry = (entry) => {
    entryPreProcessingCallbacks.forEach((cb) => cb(entry));
    if (!(entry.interactionId || entry.entryType === "first-input")) return;
    const minLongestInteraction = longestInteractionList[longestInteractionList.length - 1];
    const existingInteraction = longestInteractionMap.get(entry.interactionId);
    if (existingInteraction || longestInteractionList.length < MAX_INTERACTIONS_TO_CONSIDER || minLongestInteraction && entry.duration > minLongestInteraction.latency) {
      if (existingInteraction) {
        if (entry.duration > existingInteraction.latency) {
          existingInteraction.entries = [entry];
          existingInteraction.latency = entry.duration;
        } else if (entry.duration === existingInteraction.latency && entry.startTime === existingInteraction.entries[0]?.startTime) {
          existingInteraction.entries.push(entry);
        }
      } else {
        const interaction = {
          id: entry.interactionId,
          latency: entry.duration,
          entries: [entry]
        };
        longestInteractionMap.set(interaction.id, interaction);
        longestInteractionList.push(interaction);
      }
      longestInteractionList.sort((a, b) => b.latency - a.latency);
      if (longestInteractionList.length > MAX_INTERACTIONS_TO_CONSIDER) {
        longestInteractionList.splice(MAX_INTERACTIONS_TO_CONSIDER).forEach((i) => longestInteractionMap.delete(i.id));
      }
    }
  };

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/web-vitals/lib/whenIdle.js
  var whenIdle = (cb) => {
    const rIC = WINDOW4.requestIdleCallback || WINDOW4.setTimeout;
    let handle = -1;
    cb = runOnce(cb);
    if (WINDOW4.document?.visibilityState === "hidden") {
      cb();
    } else {
      handle = rIC(cb);
      onHidden(cb);
    }
    return handle;
  };

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/web-vitals/getINP.js
  var INPThresholds = [200, 500];
  var onINP = (onReport, opts = {}) => {
    if (!("PerformanceEventTiming" in WINDOW4 && "interactionId" in PerformanceEventTiming.prototype)) {
      return;
    }
    whenActivated(() => {
      initInteractionCountPolyfill();
      const metric = initMetric("INP");
      let report;
      const handleEntries = (entries) => {
        whenIdle(() => {
          entries.forEach(processInteractionEntry);
          const inp = estimateP98LongestInteraction();
          if (inp && inp.latency !== metric.value) {
            metric.value = inp.latency;
            metric.entries = inp.entries;
            report();
          }
        });
      };
      const po2 = observe("event", handleEntries, {
        // Event Timing entries have their durations rounded to the nearest 8ms,
        // so a duration of 40ms would be any event that spans 2.5 or more frames
        // at 60Hz. This threshold is chosen to strike a balance between usefulness
        // and performance. Running this callback for any interaction that spans
        // just one or two frames is likely not worth the insight that could be
        // gained.
        durationThreshold: opts.durationThreshold != null ? opts.durationThreshold : DEFAULT_DURATION_THRESHOLD
      });
      report = bindReporter(onReport, metric, INPThresholds, opts.reportAllChanges);
      if (po2) {
        po2.observe({ type: "first-input", buffered: true });
        onHidden(() => {
          handleEntries(po2.takeRecords());
          report(true);
        });
      }
    });
  };

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/web-vitals/getLCP.js
  var LCPThresholds = [2500, 4e3];
  var reportedMetricIDs = {};
  var onLCP = (onReport, opts = {}) => {
    whenActivated(() => {
      const visibilityWatcher = getVisibilityWatcher();
      const metric = initMetric("LCP");
      let report;
      const handleEntries = (entries) => {
        if (!opts.reportAllChanges) {
          entries = entries.slice(-1);
        }
        entries.forEach((entry) => {
          if (entry.startTime < visibilityWatcher.firstHiddenTime) {
            metric.value = Math.max(entry.startTime - getActivationStart(), 0);
            metric.entries = [entry];
            report();
          }
        });
      };
      const po2 = observe("largest-contentful-paint", handleEntries);
      if (po2) {
        report = bindReporter(onReport, metric, LCPThresholds, opts.reportAllChanges);
        const stopListening = runOnce(() => {
          if (!reportedMetricIDs[metric.id]) {
            handleEntries(po2.takeRecords());
            po2.disconnect();
            reportedMetricIDs[metric.id] = true;
            report(true);
          }
        });
        ["keydown", "click"].forEach((type) => {
          if (WINDOW4.document) {
            addEventListener(type, () => whenIdle(stopListening), {
              once: true,
              capture: true
            });
          }
        });
        onHidden(stopListening);
      }
    });
  };

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/web-vitals/onTTFB.js
  var TTFBThresholds = [800, 1800];
  var whenReady = (callback) => {
    if (WINDOW4.document?.prerendering) {
      whenActivated(() => whenReady(callback));
    } else if (WINDOW4.document?.readyState !== "complete") {
      addEventListener("load", () => whenReady(callback), true);
    } else {
      setTimeout(callback, 0);
    }
  };
  var onTTFB = (onReport, opts = {}) => {
    const metric = initMetric("TTFB");
    const report = bindReporter(onReport, metric, TTFBThresholds, opts.reportAllChanges);
    whenReady(() => {
      const navigationEntry = getNavigationEntry();
      if (navigationEntry) {
        metric.value = Math.max(navigationEntry.responseStart - getActivationStart(), 0);
        metric.entries = [navigationEntry];
        report(true);
      }
    });
  };

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/instrument.js
  var handlers2 = {};
  var instrumented2 = {};
  var _previousCls;
  var _previousFid;
  var _previousLcp;
  var _previousTtfb;
  var _previousInp;
  function addClsInstrumentationHandler(callback, stopOnCallback = false) {
    return addMetricObserver("cls", callback, instrumentCls, _previousCls, stopOnCallback);
  }
  function addLcpInstrumentationHandler(callback, stopOnCallback = false) {
    return addMetricObserver("lcp", callback, instrumentLcp, _previousLcp, stopOnCallback);
  }
  function addFidInstrumentationHandler(callback) {
    return addMetricObserver("fid", callback, instrumentFid, _previousFid);
  }
  function addTtfbInstrumentationHandler(callback) {
    return addMetricObserver("ttfb", callback, instrumentTtfb, _previousTtfb);
  }
  function addInpInstrumentationHandler(callback) {
    return addMetricObserver("inp", callback, instrumentInp, _previousInp);
  }
  function addPerformanceInstrumentationHandler(type, callback) {
    addHandler2(type, callback);
    if (!instrumented2[type]) {
      instrumentPerformanceObserver(type);
      instrumented2[type] = true;
    }
    return getCleanupCallback(type, callback);
  }
  function triggerHandlers2(type, data) {
    const typeHandlers = handlers2[type];
    if (!typeHandlers?.length) {
      return;
    }
    for (const handler of typeHandlers) {
      try {
        handler(data);
      } catch (e) {
        DEBUG_BUILD3 && logger.error(
          `Error while triggering instrumentation handler.
Type: ${type}
Name: ${getFunctionName(handler)}
Error:`,
          e
        );
      }
    }
  }
  function instrumentCls() {
    return onCLS(
      (metric) => {
        triggerHandlers2("cls", {
          metric
        });
        _previousCls = metric;
      },
      // We want the callback to be called whenever the CLS value updates.
      // By default, the callback is only called when the tab goes to the background.
      { reportAllChanges: true }
    );
  }
  function instrumentFid() {
    return onFID((metric) => {
      triggerHandlers2("fid", {
        metric
      });
      _previousFid = metric;
    });
  }
  function instrumentLcp() {
    return onLCP(
      (metric) => {
        triggerHandlers2("lcp", {
          metric
        });
        _previousLcp = metric;
      },
      // We want the callback to be called whenever the LCP value updates.
      // By default, the callback is only called when the tab goes to the background.
      { reportAllChanges: true }
    );
  }
  function instrumentTtfb() {
    return onTTFB((metric) => {
      triggerHandlers2("ttfb", {
        metric
      });
      _previousTtfb = metric;
    });
  }
  function instrumentInp() {
    return onINP((metric) => {
      triggerHandlers2("inp", {
        metric
      });
      _previousInp = metric;
    });
  }
  function addMetricObserver(type, callback, instrumentFn, previousValue, stopOnCallback = false) {
    addHandler2(type, callback);
    let stopListening;
    if (!instrumented2[type]) {
      stopListening = instrumentFn();
      instrumented2[type] = true;
    }
    if (previousValue) {
      callback({ metric: previousValue });
    }
    return getCleanupCallback(type, callback, stopOnCallback ? stopListening : void 0);
  }
  function instrumentPerformanceObserver(type) {
    const options = {};
    if (type === "event") {
      options.durationThreshold = 0;
    }
    observe(
      type,
      (entries) => {
        triggerHandlers2(type, { entries });
      },
      options
    );
  }
  function addHandler2(type, handler) {
    handlers2[type] = handlers2[type] || [];
    handlers2[type].push(handler);
  }
  function getCleanupCallback(type, callback, stopListening) {
    return () => {
      if (stopListening) {
        stopListening();
      }
      const typeHandlers = handlers2[type];
      if (!typeHandlers) {
        return;
      }
      const index = typeHandlers.indexOf(callback);
      if (index !== -1) {
        typeHandlers.splice(index, 1);
      }
    };
  }
  function isPerformanceEventTiming(entry) {
    return "duration" in entry;
  }

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/utils.js
  function isMeasurementValue(value) {
    return typeof value === "number" && isFinite(value);
  }
  function startAndEndSpan(parentSpan, startTimeInSeconds, endTime, { ...ctx }) {
    const parentStartTime = spanToJSON(parentSpan).start_timestamp;
    if (parentStartTime && parentStartTime > startTimeInSeconds) {
      if (typeof parentSpan.updateStartTime === "function") {
        parentSpan.updateStartTime(startTimeInSeconds);
      }
    }
    return withActiveSpan(parentSpan, () => {
      const span = startInactiveSpan({
        startTime: startTimeInSeconds,
        ...ctx
      });
      if (span) {
        span.end(endTime);
      }
      return span;
    });
  }
  function startStandaloneWebVitalSpan(options) {
    const client = getClient();
    if (!client) {
      return;
    }
    const { name, transaction, attributes: passedAttributes, startTime } = options;
    const { release, environment, sendDefaultPii } = client.getOptions();
    const replay = client.getIntegrationByName("Replay");
    const replayId = replay?.getReplayId();
    const scope = getCurrentScope();
    const user = scope.getUser();
    const userDisplay = user !== void 0 ? user.email || user.id || user.ip_address : void 0;
    let profileId;
    try {
      profileId = scope.getScopeData().contexts.profile.profile_id;
    } catch {
    }
    const attributes = {
      release,
      environment,
      user: userDisplay || void 0,
      profile_id: profileId || void 0,
      replay_id: replayId || void 0,
      transaction,
      // Web vital score calculation relies on the user agent to account for different
      // browsers setting different thresholds for what is considered a good/meh/bad value.
      // For example: Chrome vs. Chrome Mobile
      "user_agent.original": WINDOW4.navigator?.userAgent,
      // This tells Sentry to infer the IP address from the request
      "client.address": sendDefaultPii ? "{{auto}}" : void 0,
      ...passedAttributes
    };
    return startInactiveSpan({
      name,
      attributes,
      startTime,
      experimental: {
        standalone: true
      }
    });
  }
  function getBrowserPerformanceAPI() {
    return WINDOW4.addEventListener && WINDOW4.performance;
  }
  function msToSec(time) {
    return time / 1e3;
  }
  function extractNetworkProtocol(nextHopProtocol) {
    let name = "unknown";
    let version = "unknown";
    let _name = "";
    for (const char of nextHopProtocol) {
      if (char === "/") {
        [name, version] = nextHopProtocol.split("/");
        break;
      }
      if (!isNaN(Number(char))) {
        name = _name === "h" ? "http" : _name;
        version = nextHopProtocol.split(_name)[1];
        break;
      }
      _name += char;
    }
    if (_name === nextHopProtocol) {
      name = _name;
    }
    return { name, version };
  }

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/cls.js
  function trackClsAsStandaloneSpan() {
    let standaloneCLsValue = 0;
    let standaloneClsEntry;
    let pageloadSpanId;
    if (!supportsLayoutShift()) {
      return;
    }
    let sentSpan = false;
    function _collectClsOnce() {
      if (sentSpan) {
        return;
      }
      sentSpan = true;
      if (pageloadSpanId) {
        sendStandaloneClsSpan(standaloneCLsValue, standaloneClsEntry, pageloadSpanId);
      }
      cleanupClsHandler();
    }
    const cleanupClsHandler = addClsInstrumentationHandler(({ metric }) => {
      const entry = metric.entries[metric.entries.length - 1];
      if (!entry) {
        return;
      }
      standaloneCLsValue = metric.value;
      standaloneClsEntry = entry;
    }, true);
    onHidden(() => {
      _collectClsOnce();
    });
    setTimeout(() => {
      const client = getClient();
      if (!client) {
        return;
      }
      const unsubscribeStartNavigation = client.on("startNavigationSpan", () => {
        _collectClsOnce();
        unsubscribeStartNavigation?.();
      });
      const activeSpan = getActiveSpan();
      if (activeSpan) {
        const rootSpan = getRootSpan(activeSpan);
        const spanJSON = spanToJSON(rootSpan);
        if (spanJSON.op === "pageload") {
          pageloadSpanId = rootSpan.spanContext().spanId;
        }
      }
    }, 0);
  }
  function sendStandaloneClsSpan(clsValue, entry, pageloadSpanId) {
    DEBUG_BUILD3 && logger.log(`Sending CLS span (${clsValue})`);
    const startTime = msToSec((browserPerformanceTimeOrigin() || 0) + (entry?.startTime || 0));
    const routeName = getCurrentScope().getScopeData().transactionName;
    const name = entry ? htmlTreeAsString(entry.sources[0]?.node) : "Layout shift";
    const attributes = dropUndefinedKeys({
      [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.browser.cls",
      [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "ui.webvital.cls",
      [SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME]: entry?.duration || 0,
      // attach the pageload span id to the CLS span so that we can link them in the UI
      "sentry.pageload.span_id": pageloadSpanId
    });
    const span = startStandaloneWebVitalSpan({
      name,
      transaction: routeName,
      attributes,
      startTime
    });
    if (span) {
      span.addEvent("cls", {
        [SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT]: "",
        [SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE]: clsValue
      });
      span.end(startTime);
    }
  }
  function supportsLayoutShift() {
    try {
      return PerformanceObserver.supportedEntryTypes.includes("layout-shift");
    } catch {
      return false;
    }
  }

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/browserMetrics.js
  var MAX_INT_AS_BYTES = 2147483647;
  var _performanceCursor = 0;
  var _measurements = {};
  var _lcpEntry;
  var _clsEntry;
  function startTrackingWebVitals({ recordClsStandaloneSpans }) {
    const performance2 = getBrowserPerformanceAPI();
    if (performance2 && browserPerformanceTimeOrigin()) {
      if (performance2.mark) {
        WINDOW4.performance.mark("sentry-tracing-init");
      }
      const fidCleanupCallback = _trackFID();
      const lcpCleanupCallback = _trackLCP();
      const ttfbCleanupCallback = _trackTtfb();
      const clsCleanupCallback = recordClsStandaloneSpans ? trackClsAsStandaloneSpan() : _trackCLS();
      return () => {
        fidCleanupCallback();
        lcpCleanupCallback();
        ttfbCleanupCallback();
        clsCleanupCallback?.();
      };
    }
    return () => void 0;
  }
  function startTrackingLongTasks() {
    addPerformanceInstrumentationHandler("longtask", ({ entries }) => {
      const parent = getActiveSpan();
      if (!parent) {
        return;
      }
      const { op: parentOp, start_timestamp: parentStartTimestamp } = spanToJSON(parent);
      for (const entry of entries) {
        const startTime = msToSec(browserPerformanceTimeOrigin() + entry.startTime);
        const duration = msToSec(entry.duration);
        if (parentOp === "navigation" && parentStartTimestamp && startTime < parentStartTimestamp) {
          continue;
        }
        startAndEndSpan(parent, startTime, startTime + duration, {
          name: "Main UI thread blocked",
          op: "ui.long-task",
          attributes: {
            [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.browser.metrics"
          }
        });
      }
    });
  }
  function startTrackingLongAnimationFrames() {
    const observer = new PerformanceObserver((list) => {
      const parent = getActiveSpan();
      if (!parent) {
        return;
      }
      for (const entry of list.getEntries()) {
        if (!entry.scripts[0]) {
          continue;
        }
        const startTime = msToSec(browserPerformanceTimeOrigin() + entry.startTime);
        const { start_timestamp: parentStartTimestamp, op: parentOp } = spanToJSON(parent);
        if (parentOp === "navigation" && parentStartTimestamp && startTime < parentStartTimestamp) {
          continue;
        }
        const duration = msToSec(entry.duration);
        const attributes = {
          [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.browser.metrics"
        };
        const initialScript = entry.scripts[0];
        const { invoker, invokerType, sourceURL, sourceFunctionName, sourceCharPosition } = initialScript;
        attributes["browser.script.invoker"] = invoker;
        attributes["browser.script.invoker_type"] = invokerType;
        if (sourceURL) {
          attributes["code.filepath"] = sourceURL;
        }
        if (sourceFunctionName) {
          attributes["code.function"] = sourceFunctionName;
        }
        if (sourceCharPosition !== -1) {
          attributes["browser.script.source_char_position"] = sourceCharPosition;
        }
        startAndEndSpan(parent, startTime, startTime + duration, {
          name: "Main UI thread blocked",
          op: "ui.long-animation-frame",
          attributes
        });
      }
    });
    observer.observe({ type: "long-animation-frame", buffered: true });
  }
  function startTrackingInteractions() {
    addPerformanceInstrumentationHandler("event", ({ entries }) => {
      const parent = getActiveSpan();
      if (!parent) {
        return;
      }
      for (const entry of entries) {
        if (entry.name === "click") {
          const startTime = msToSec(browserPerformanceTimeOrigin() + entry.startTime);
          const duration = msToSec(entry.duration);
          const spanOptions = {
            name: htmlTreeAsString(entry.target),
            op: `ui.interaction.${entry.name}`,
            startTime,
            attributes: {
              [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.browser.metrics"
            }
          };
          const componentName = getComponentName(entry.target);
          if (componentName) {
            spanOptions.attributes["ui.component_name"] = componentName;
          }
          startAndEndSpan(parent, startTime, startTime + duration, spanOptions);
        }
      }
    });
  }
  function _trackCLS() {
    return addClsInstrumentationHandler(({ metric }) => {
      const entry = metric.entries[metric.entries.length - 1];
      if (!entry) {
        return;
      }
      _measurements["cls"] = { value: metric.value, unit: "" };
      _clsEntry = entry;
    }, true);
  }
  function _trackLCP() {
    return addLcpInstrumentationHandler(({ metric }) => {
      const entry = metric.entries[metric.entries.length - 1];
      if (!entry) {
        return;
      }
      _measurements["lcp"] = { value: metric.value, unit: "millisecond" };
      _lcpEntry = entry;
    }, true);
  }
  function _trackFID() {
    return addFidInstrumentationHandler(({ metric }) => {
      const entry = metric.entries[metric.entries.length - 1];
      if (!entry) {
        return;
      }
      const timeOrigin = msToSec(browserPerformanceTimeOrigin());
      const startTime = msToSec(entry.startTime);
      _measurements["fid"] = { value: metric.value, unit: "millisecond" };
      _measurements["mark.fid"] = { value: timeOrigin + startTime, unit: "second" };
    });
  }
  function _trackTtfb() {
    return addTtfbInstrumentationHandler(({ metric }) => {
      const entry = metric.entries[metric.entries.length - 1];
      if (!entry) {
        return;
      }
      _measurements["ttfb"] = { value: metric.value, unit: "millisecond" };
    });
  }
  function addPerformanceEntries(span, options) {
    const performance2 = getBrowserPerformanceAPI();
    const origin = browserPerformanceTimeOrigin();
    if (!performance2?.getEntries || !origin) {
      return;
    }
    const timeOrigin = msToSec(origin);
    const performanceEntries = performance2.getEntries();
    const { op, start_timestamp: transactionStartTime } = spanToJSON(span);
    performanceEntries.slice(_performanceCursor).forEach((entry) => {
      const startTime = msToSec(entry.startTime);
      const duration = msToSec(
        // Inexplicably, Chrome sometimes emits a negative duration. We need to work around this.
        // There is a SO post attempting to explain this, but it leaves one with open questions: https://stackoverflow.com/questions/23191918/peformance-getentries-and-negative-duration-display
        // The way we clamp the value is probably not accurate, since we have observed this happen for things that may take a while to load, like for example the replay worker.
        // TODO: Investigate why this happens and how to properly mitigate. For now, this is a workaround to prevent transactions being dropped due to negative duration spans.
        Math.max(0, entry.duration)
      );
      if (op === "navigation" && transactionStartTime && timeOrigin + startTime < transactionStartTime) {
        return;
      }
      switch (entry.entryType) {
        case "navigation": {
          _addNavigationSpans(span, entry, timeOrigin);
          break;
        }
        case "mark":
        case "paint":
        case "measure": {
          _addMeasureSpans(span, entry, startTime, duration, timeOrigin);
          const firstHidden = getVisibilityWatcher();
          const shouldRecord = entry.startTime < firstHidden.firstHiddenTime;
          if (entry.name === "first-paint" && shouldRecord) {
            _measurements["fp"] = { value: entry.startTime, unit: "millisecond" };
          }
          if (entry.name === "first-contentful-paint" && shouldRecord) {
            _measurements["fcp"] = { value: entry.startTime, unit: "millisecond" };
          }
          break;
        }
        case "resource": {
          _addResourceSpans(span, entry, entry.name, startTime, duration, timeOrigin);
          break;
        }
      }
    });
    _performanceCursor = Math.max(performanceEntries.length - 1, 0);
    _trackNavigator(span);
    if (op === "pageload") {
      _addTtfbRequestTimeToMeasurements(_measurements);
      const fidMark = _measurements["mark.fid"];
      if (fidMark && _measurements["fid"]) {
        startAndEndSpan(span, fidMark.value, fidMark.value + msToSec(_measurements["fid"].value), {
          name: "first input delay",
          op: "ui.action",
          attributes: {
            [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.browser.metrics"
          }
        });
        delete _measurements["mark.fid"];
      }
      if (!("fcp" in _measurements) || !options.recordClsOnPageloadSpan) {
        delete _measurements.cls;
      }
      Object.entries(_measurements).forEach(([measurementName, measurement]) => {
        setMeasurement(measurementName, measurement.value, measurement.unit);
      });
      span.setAttribute("performance.timeOrigin", timeOrigin);
      span.setAttribute("performance.activationStart", getActivationStart());
      _setWebVitalAttributes(span);
    }
    _lcpEntry = void 0;
    _clsEntry = void 0;
    _measurements = {};
  }
  function _addMeasureSpans(span, entry, startTime, duration, timeOrigin) {
    const navEntry = getNavigationEntry(false);
    const requestTime = msToSec(navEntry ? navEntry.requestStart : 0);
    const measureStartTimestamp = timeOrigin + Math.max(startTime, requestTime);
    const startTimeStamp = timeOrigin + startTime;
    const measureEndTimestamp = startTimeStamp + duration;
    const attributes = {
      [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.resource.browser.metrics"
    };
    if (measureStartTimestamp !== startTimeStamp) {
      attributes["sentry.browser.measure_happened_before_request"] = true;
      attributes["sentry.browser.measure_start_time"] = measureStartTimestamp;
    }
    if (measureStartTimestamp <= measureEndTimestamp) {
      startAndEndSpan(span, measureStartTimestamp, measureEndTimestamp, {
        name: entry.name,
        op: entry.entryType,
        attributes
      });
    }
  }
  function _addNavigationSpans(span, entry, timeOrigin) {
    ["unloadEvent", "redirect", "domContentLoadedEvent", "loadEvent", "connect"].forEach((event) => {
      _addPerformanceNavigationTiming(span, entry, event, timeOrigin);
    });
    _addPerformanceNavigationTiming(span, entry, "secureConnection", timeOrigin, "TLS/SSL");
    _addPerformanceNavigationTiming(span, entry, "fetch", timeOrigin, "cache");
    _addPerformanceNavigationTiming(span, entry, "domainLookup", timeOrigin, "DNS");
    _addRequest(span, entry, timeOrigin);
  }
  function _addPerformanceNavigationTiming(span, entry, event, timeOrigin, name = event) {
    const eventEnd = _getEndPropertyNameForNavigationTiming(event);
    const end = entry[eventEnd];
    const start = entry[`${event}Start`];
    if (!start || !end) {
      return;
    }
    startAndEndSpan(span, timeOrigin + msToSec(start), timeOrigin + msToSec(end), {
      op: `browser.${name}`,
      name: entry.name,
      attributes: {
        [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.browser.metrics"
      }
    });
  }
  function _getEndPropertyNameForNavigationTiming(event) {
    if (event === "secureConnection") {
      return "connectEnd";
    }
    if (event === "fetch") {
      return "domainLookupStart";
    }
    return `${event}End`;
  }
  function _addRequest(span, entry, timeOrigin) {
    const requestStartTimestamp = timeOrigin + msToSec(entry.requestStart);
    const responseEndTimestamp = timeOrigin + msToSec(entry.responseEnd);
    const responseStartTimestamp = timeOrigin + msToSec(entry.responseStart);
    if (entry.responseEnd) {
      startAndEndSpan(span, requestStartTimestamp, responseEndTimestamp, {
        op: "browser.request",
        name: entry.name,
        attributes: {
          [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.browser.metrics"
        }
      });
      startAndEndSpan(span, responseStartTimestamp, responseEndTimestamp, {
        op: "browser.response",
        name: entry.name,
        attributes: {
          [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.ui.browser.metrics"
        }
      });
    }
  }
  function _addResourceSpans(span, entry, resourceUrl, startTime, duration, timeOrigin) {
    if (entry.initiatorType === "xmlhttprequest" || entry.initiatorType === "fetch") {
      return;
    }
    const parsedUrl = parseUrl(resourceUrl);
    const attributes = {
      [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.resource.browser.metrics"
    };
    setResourceEntrySizeData(attributes, entry, "transferSize", "http.response_transfer_size");
    setResourceEntrySizeData(attributes, entry, "encodedBodySize", "http.response_content_length");
    setResourceEntrySizeData(attributes, entry, "decodedBodySize", "http.decoded_response_content_length");
    const deliveryType = entry.deliveryType;
    if (deliveryType != null) {
      attributes["http.response_delivery_type"] = deliveryType;
    }
    const renderBlockingStatus = entry.renderBlockingStatus;
    if (renderBlockingStatus) {
      attributes["resource.render_blocking_status"] = renderBlockingStatus;
    }
    if (parsedUrl.protocol) {
      attributes["url.scheme"] = parsedUrl.protocol.split(":").pop();
    }
    if (parsedUrl.host) {
      attributes["server.address"] = parsedUrl.host;
    }
    attributes["url.same_origin"] = resourceUrl.includes(WINDOW4.location.origin);
    const { name, version } = extractNetworkProtocol(entry.nextHopProtocol);
    attributes["network.protocol.name"] = name;
    attributes["network.protocol.version"] = version;
    const startTimestamp = timeOrigin + startTime;
    const endTimestamp = startTimestamp + duration;
    startAndEndSpan(span, startTimestamp, endTimestamp, {
      name: resourceUrl.replace(WINDOW4.location.origin, ""),
      op: entry.initiatorType ? `resource.${entry.initiatorType}` : "resource.other",
      attributes
    });
  }
  function _trackNavigator(span) {
    const navigator = WINDOW4.navigator;
    if (!navigator) {
      return;
    }
    const connection = navigator.connection;
    if (connection) {
      if (connection.effectiveType) {
        span.setAttribute("effectiveConnectionType", connection.effectiveType);
      }
      if (connection.type) {
        span.setAttribute("connectionType", connection.type);
      }
      if (isMeasurementValue(connection.rtt)) {
        _measurements["connection.rtt"] = { value: connection.rtt, unit: "millisecond" };
      }
    }
    if (isMeasurementValue(navigator.deviceMemory)) {
      span.setAttribute("deviceMemory", `${navigator.deviceMemory} GB`);
    }
    if (isMeasurementValue(navigator.hardwareConcurrency)) {
      span.setAttribute("hardwareConcurrency", String(navigator.hardwareConcurrency));
    }
  }
  function _setWebVitalAttributes(span) {
    if (_lcpEntry) {
      if (_lcpEntry.element) {
        span.setAttribute("lcp.element", htmlTreeAsString(_lcpEntry.element));
      }
      if (_lcpEntry.id) {
        span.setAttribute("lcp.id", _lcpEntry.id);
      }
      if (_lcpEntry.url) {
        span.setAttribute("lcp.url", _lcpEntry.url.trim().slice(0, 200));
      }
      if (_lcpEntry.loadTime != null) {
        span.setAttribute("lcp.loadTime", _lcpEntry.loadTime);
      }
      if (_lcpEntry.renderTime != null) {
        span.setAttribute("lcp.renderTime", _lcpEntry.renderTime);
      }
      span.setAttribute("lcp.size", _lcpEntry.size);
    }
    if (_clsEntry?.sources) {
      _clsEntry.sources.forEach(
        (source, index) => span.setAttribute(`cls.source.${index + 1}`, htmlTreeAsString(source.node))
      );
    }
  }
  function setResourceEntrySizeData(attributes, entry, key, dataKey) {
    const entryVal = entry[key];
    if (entryVal != null && entryVal < MAX_INT_AS_BYTES) {
      attributes[dataKey] = entryVal;
    }
  }
  function _addTtfbRequestTimeToMeasurements(_measurements2) {
    const navEntry = getNavigationEntry(false);
    if (!navEntry) {
      return;
    }
    const { responseStart, requestStart } = navEntry;
    if (requestStart <= responseStart) {
      _measurements2["ttfb.requestTime"] = {
        value: responseStart - requestStart,
        unit: "millisecond"
      };
    }
  }

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/instrument/dom.js
  var DEBOUNCE_DURATION = 1e3;
  var debounceTimerID;
  var lastCapturedEventType;
  var lastCapturedEventTargetId;
  function addClickKeypressInstrumentationHandler(handler) {
    const type = "dom";
    addHandler(type, handler);
    maybeInstrument(type, instrumentDOM);
  }
  function instrumentDOM() {
    if (!WINDOW4.document) {
      return;
    }
    const triggerDOMHandler = triggerHandlers.bind(null, "dom");
    const globalDOMEventHandler = makeDOMEventHandler(triggerDOMHandler, true);
    WINDOW4.document.addEventListener("click", globalDOMEventHandler, false);
    WINDOW4.document.addEventListener("keypress", globalDOMEventHandler, false);
    ["EventTarget", "Node"].forEach((target) => {
      const globalObject = WINDOW4;
      const proto = globalObject[target]?.prototype;
      if (!proto?.hasOwnProperty?.("addEventListener")) {
        return;
      }
      fill(proto, "addEventListener", function(originalAddEventListener) {
        return function(type, listener, options) {
          if (type === "click" || type == "keypress") {
            try {
              const handlers3 = this.__sentry_instrumentation_handlers__ = this.__sentry_instrumentation_handlers__ || {};
              const handlerForType = handlers3[type] = handlers3[type] || { refCount: 0 };
              if (!handlerForType.handler) {
                const handler = makeDOMEventHandler(triggerDOMHandler);
                handlerForType.handler = handler;
                originalAddEventListener.call(this, type, handler, options);
              }
              handlerForType.refCount++;
            } catch (e) {
            }
          }
          return originalAddEventListener.call(this, type, listener, options);
        };
      });
      fill(
        proto,
        "removeEventListener",
        function(originalRemoveEventListener) {
          return function(type, listener, options) {
            if (type === "click" || type == "keypress") {
              try {
                const handlers3 = this.__sentry_instrumentation_handlers__ || {};
                const handlerForType = handlers3[type];
                if (handlerForType) {
                  handlerForType.refCount--;
                  if (handlerForType.refCount <= 0) {
                    originalRemoveEventListener.call(this, type, handlerForType.handler, options);
                    handlerForType.handler = void 0;
                    delete handlers3[type];
                  }
                  if (Object.keys(handlers3).length === 0) {
                    delete this.__sentry_instrumentation_handlers__;
                  }
                }
              } catch (e) {
              }
            }
            return originalRemoveEventListener.call(this, type, listener, options);
          };
        }
      );
    });
  }
  function isSimilarToLastCapturedEvent(event) {
    if (event.type !== lastCapturedEventType) {
      return false;
    }
    try {
      if (!event.target || event.target._sentryId !== lastCapturedEventTargetId) {
        return false;
      }
    } catch (e) {
    }
    return true;
  }
  function shouldSkipDOMEvent(eventType, target) {
    if (eventType !== "keypress") {
      return false;
    }
    if (!target?.tagName) {
      return true;
    }
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      return false;
    }
    return true;
  }
  function makeDOMEventHandler(handler, globalListener = false) {
    return (event) => {
      if (!event || event["_sentryCaptured"]) {
        return;
      }
      const target = getEventTarget(event);
      if (shouldSkipDOMEvent(event.type, target)) {
        return;
      }
      addNonEnumerableProperty(event, "_sentryCaptured", true);
      if (target && !target._sentryId) {
        addNonEnumerableProperty(target, "_sentryId", uuid4());
      }
      const name = event.type === "keypress" ? "input" : event.type;
      if (!isSimilarToLastCapturedEvent(event)) {
        const handlerData = { event, name, global: globalListener };
        handler(handlerData);
        lastCapturedEventType = event.type;
        lastCapturedEventTargetId = target ? target._sentryId : void 0;
      }
      clearTimeout(debounceTimerID);
      debounceTimerID = WINDOW4.setTimeout(() => {
        lastCapturedEventTargetId = void 0;
        lastCapturedEventType = void 0;
      }, DEBOUNCE_DURATION);
    };
  }
  function getEventTarget(event) {
    try {
      return event.target;
    } catch (e) {
      return null;
    }
  }

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/instrument/history.js
  var lastHref;
  function addHistoryInstrumentationHandler(handler) {
    const type = "history";
    addHandler(type, handler);
    maybeInstrument(type, instrumentHistory);
  }
  function instrumentHistory() {
    WINDOW4.addEventListener("popstate", () => {
      const to = WINDOW4.location.href;
      const from = lastHref;
      lastHref = to;
      if (from === to) {
        return;
      }
      const handlerData = { from, to };
      triggerHandlers("history", handlerData);
    });
    if (!supportsHistory()) {
      return;
    }
    function historyReplacementFunction(originalHistoryFunction) {
      return function(...args) {
        const url = args.length > 2 ? args[2] : void 0;
        if (url) {
          const from = lastHref;
          const to = String(url);
          lastHref = to;
          if (from === to) {
            return;
          }
          const handlerData = { from, to };
          triggerHandlers("history", handlerData);
        }
        return originalHistoryFunction.apply(this, args);
      };
    }
    fill(WINDOW4.history, "pushState", historyReplacementFunction);
    fill(WINDOW4.history, "replaceState", historyReplacementFunction);
  }

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/getNativeImplementation.js
  var cachedImplementations = {};
  function getNativeImplementation(name) {
    const cached = cachedImplementations[name];
    if (cached) {
      return cached;
    }
    let impl = WINDOW4[name];
    if (isNativeFunction(impl)) {
      return cachedImplementations[name] = impl.bind(WINDOW4);
    }
    const document2 = WINDOW4.document;
    if (document2 && typeof document2.createElement === "function") {
      try {
        const sandbox = document2.createElement("iframe");
        sandbox.hidden = true;
        document2.head.appendChild(sandbox);
        const contentWindow = sandbox.contentWindow;
        if (contentWindow?.[name]) {
          impl = contentWindow[name];
        }
        document2.head.removeChild(sandbox);
      } catch (e) {
        DEBUG_BUILD3 && logger.warn(`Could not create sandbox iframe for ${name} check, bailing to window.${name}: `, e);
      }
    }
    if (!impl) {
      return impl;
    }
    return cachedImplementations[name] = impl.bind(WINDOW4);
  }
  function clearCachedImplementation(name) {
    cachedImplementations[name] = void 0;
  }

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/instrument/xhr.js
  var SENTRY_XHR_DATA_KEY = "__sentry_xhr_v3__";
  function addXhrInstrumentationHandler(handler) {
    const type = "xhr";
    addHandler(type, handler);
    maybeInstrument(type, instrumentXHR);
  }
  function instrumentXHR() {
    if (!WINDOW4.XMLHttpRequest) {
      return;
    }
    const xhrproto = XMLHttpRequest.prototype;
    xhrproto.open = new Proxy(xhrproto.open, {
      apply(originalOpen, xhrOpenThisArg, xhrOpenArgArray) {
        const virtualError = new Error();
        const startTimestamp = timestampInSeconds() * 1e3;
        const method = isString(xhrOpenArgArray[0]) ? xhrOpenArgArray[0].toUpperCase() : void 0;
        const url = parseUrl2(xhrOpenArgArray[1]);
        if (!method || !url) {
          return originalOpen.apply(xhrOpenThisArg, xhrOpenArgArray);
        }
        xhrOpenThisArg[SENTRY_XHR_DATA_KEY] = {
          method,
          url,
          request_headers: {}
        };
        if (method === "POST" && url.match(/sentry_key/)) {
          xhrOpenThisArg.__sentry_own_request__ = true;
        }
        const onreadystatechangeHandler = () => {
          const xhrInfo = xhrOpenThisArg[SENTRY_XHR_DATA_KEY];
          if (!xhrInfo) {
            return;
          }
          if (xhrOpenThisArg.readyState === 4) {
            try {
              xhrInfo.status_code = xhrOpenThisArg.status;
            } catch (e) {
            }
            const handlerData = {
              endTimestamp: timestampInSeconds() * 1e3,
              startTimestamp,
              xhr: xhrOpenThisArg,
              virtualError
            };
            triggerHandlers("xhr", handlerData);
          }
        };
        if ("onreadystatechange" in xhrOpenThisArg && typeof xhrOpenThisArg.onreadystatechange === "function") {
          xhrOpenThisArg.onreadystatechange = new Proxy(xhrOpenThisArg.onreadystatechange, {
            apply(originalOnreadystatechange, onreadystatechangeThisArg, onreadystatechangeArgArray) {
              onreadystatechangeHandler();
              return originalOnreadystatechange.apply(onreadystatechangeThisArg, onreadystatechangeArgArray);
            }
          });
        } else {
          xhrOpenThisArg.addEventListener("readystatechange", onreadystatechangeHandler);
        }
        xhrOpenThisArg.setRequestHeader = new Proxy(xhrOpenThisArg.setRequestHeader, {
          apply(originalSetRequestHeader, setRequestHeaderThisArg, setRequestHeaderArgArray) {
            const [header, value] = setRequestHeaderArgArray;
            const xhrInfo = setRequestHeaderThisArg[SENTRY_XHR_DATA_KEY];
            if (xhrInfo && isString(header) && isString(value)) {
              xhrInfo.request_headers[header.toLowerCase()] = value;
            }
            return originalSetRequestHeader.apply(setRequestHeaderThisArg, setRequestHeaderArgArray);
          }
        });
        return originalOpen.apply(xhrOpenThisArg, xhrOpenArgArray);
      }
    });
    xhrproto.send = new Proxy(xhrproto.send, {
      apply(originalSend, sendThisArg, sendArgArray) {
        const sentryXhrData = sendThisArg[SENTRY_XHR_DATA_KEY];
        if (!sentryXhrData) {
          return originalSend.apply(sendThisArg, sendArgArray);
        }
        if (sendArgArray[0] !== void 0) {
          sentryXhrData.body = sendArgArray[0];
        }
        const handlerData = {
          startTimestamp: timestampInSeconds() * 1e3,
          xhr: sendThisArg
        };
        triggerHandlers("xhr", handlerData);
        return originalSend.apply(sendThisArg, sendArgArray);
      }
    });
  }
  function parseUrl2(url) {
    if (isString(url)) {
      return url;
    }
    try {
      return url.toString();
    } catch {
    }
    return void 0;
  }

  // ../../node_modules/@sentry-internal/browser-utils/build/esm/metrics/inp.js
  var LAST_INTERACTIONS = [];
  var INTERACTIONS_SPAN_MAP = /* @__PURE__ */ new Map();
  function startTrackingINP() {
    const performance2 = getBrowserPerformanceAPI();
    if (performance2 && browserPerformanceTimeOrigin()) {
      const inpCallback = _trackINP();
      return () => {
        inpCallback();
      };
    }
    return () => void 0;
  }
  var INP_ENTRY_MAP = {
    click: "click",
    pointerdown: "click",
    pointerup: "click",
    mousedown: "click",
    mouseup: "click",
    touchstart: "click",
    touchend: "click",
    mouseover: "hover",
    mouseout: "hover",
    mouseenter: "hover",
    mouseleave: "hover",
    pointerover: "hover",
    pointerout: "hover",
    pointerenter: "hover",
    pointerleave: "hover",
    dragstart: "drag",
    dragend: "drag",
    drag: "drag",
    dragenter: "drag",
    dragleave: "drag",
    dragover: "drag",
    drop: "drag",
    keydown: "press",
    keyup: "press",
    keypress: "press",
    input: "press"
  };
  function _trackINP() {
    return addInpInstrumentationHandler(({ metric }) => {
      if (metric.value == void 0) {
        return;
      }
      const entry = metric.entries.find((entry2) => entry2.duration === metric.value && INP_ENTRY_MAP[entry2.name]);
      if (!entry) {
        return;
      }
      const { interactionId } = entry;
      const interactionType = INP_ENTRY_MAP[entry.name];
      const startTime = msToSec(browserPerformanceTimeOrigin() + entry.startTime);
      const duration = msToSec(metric.value);
      const activeSpan = getActiveSpan();
      const rootSpan = activeSpan ? getRootSpan(activeSpan) : void 0;
      const cachedSpan = interactionId != null ? INTERACTIONS_SPAN_MAP.get(interactionId) : void 0;
      const spanToUse = cachedSpan || rootSpan;
      const routeName = spanToUse ? spanToJSON(spanToUse).description : getCurrentScope().getScopeData().transactionName;
      const name = htmlTreeAsString(entry.target);
      const attributes = dropUndefinedKeys({
        [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.browser.inp",
        [SEMANTIC_ATTRIBUTE_SENTRY_OP]: `ui.interaction.${interactionType}`,
        [SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME]: entry.duration
      });
      const span = startStandaloneWebVitalSpan({
        name,
        transaction: routeName,
        attributes,
        startTime
      });
      if (span) {
        span.addEvent("inp", {
          [SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT]: "millisecond",
          [SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE]: metric.value
        });
        span.end(startTime + duration);
      }
    });
  }
  function registerInpInteractionListener() {
    const handleEntries = ({ entries }) => {
      const activeSpan = getActiveSpan();
      const activeRootSpan = activeSpan && getRootSpan(activeSpan);
      entries.forEach((entry) => {
        if (!isPerformanceEventTiming(entry) || !activeRootSpan) {
          return;
        }
        const interactionId = entry.interactionId;
        if (interactionId == null) {
          return;
        }
        if (INTERACTIONS_SPAN_MAP.has(interactionId)) {
          return;
        }
        if (LAST_INTERACTIONS.length > 10) {
          const last = LAST_INTERACTIONS.shift();
          INTERACTIONS_SPAN_MAP.delete(last);
        }
        LAST_INTERACTIONS.push(interactionId);
        INTERACTIONS_SPAN_MAP.set(interactionId, activeRootSpan);
      });
    };
    addPerformanceInstrumentationHandler("event", handleEntries);
    addPerformanceInstrumentationHandler("first-input", handleEntries);
  }

  // ../../node_modules/@sentry/browser/build/npm/esm/transports/fetch.js
  function makeFetchTransport(options, nativeFetch = getNativeImplementation("fetch")) {
    let pendingBodySize = 0;
    let pendingCount = 0;
    function makeRequest(request) {
      const requestSize = request.body.length;
      pendingBodySize += requestSize;
      pendingCount++;
      const requestOptions = {
        body: request.body,
        method: "POST",
        referrerPolicy: "strict-origin",
        headers: options.headers,
        // Outgoing requests are usually cancelled when navigating to a different page, causing a "TypeError: Failed to
        // fetch" error and sending a "network_error" client-outcome - in Chrome, the request status shows "(cancelled)".
        // The `keepalive` flag keeps outgoing requests alive, even when switching pages. We want this since we're
        // frequently sending events right before the user is switching pages (eg. when finishing navigation transactions).
        // Gotchas:
        // - `keepalive` isn't supported by Firefox
        // - As per spec (https://fetch.spec.whatwg.org/#http-network-or-cache-fetch):
        //   If the sum of contentLength and inflightKeepaliveBytes is greater than 64 kibibytes, then return a network error.
        //   We will therefore only activate the flag when we're below that limit.
        // There is also a limit of requests that can be open at the same time, so we also limit this to 15
        // See https://github.com/getsentry/sentry-javascript/pull/7553 for details
        keepalive: pendingBodySize <= 6e4 && pendingCount < 15,
        ...options.fetchOptions
      };
      if (!nativeFetch) {
        clearCachedImplementation("fetch");
        return rejectedSyncPromise("No fetch implementation available");
      }
      try {
        return nativeFetch(options.url, requestOptions).then((response) => {
          pendingBodySize -= requestSize;
          pendingCount--;
          return {
            statusCode: response.status,
            headers: {
              "x-sentry-rate-limits": response.headers.get("X-Sentry-Rate-Limits"),
              "retry-after": response.headers.get("Retry-After")
            }
          };
        });
      } catch (e) {
        clearCachedImplementation("fetch");
        pendingBodySize -= requestSize;
        pendingCount--;
        return rejectedSyncPromise(e);
      }
    }
    return createTransport(options, makeRequest);
  }

  // ../../node_modules/@sentry/browser/build/npm/esm/stack-parsers.js
  var CHROME_PRIORITY = 30;
  var GECKO_PRIORITY = 50;
  function createFrame(filename, func, lineno, colno) {
    const frame = {
      filename,
      function: func === "<anonymous>" ? UNKNOWN_FUNCTION : func,
      in_app: true
      // All browser frames are considered in_app
    };
    if (lineno !== void 0) {
      frame.lineno = lineno;
    }
    if (colno !== void 0) {
      frame.colno = colno;
    }
    return frame;
  }
  var chromeRegexNoFnName = /^\s*at (\S+?)(?::(\d+))(?::(\d+))\s*$/i;
  var chromeRegex = /^\s*at (?:(.+?\)(?: \[.+\])?|.*?) ?\((?:address at )?)?(?:async )?((?:<anonymous>|[-a-z]+:|.*bundle|\/)?.*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i;
  var chromeEvalRegex = /\((\S*)(?::(\d+))(?::(\d+))\)/;
  var chromeStackParserFn = (line) => {
    const noFnParts = chromeRegexNoFnName.exec(line);
    if (noFnParts) {
      const [, filename, line2, col] = noFnParts;
      return createFrame(filename, UNKNOWN_FUNCTION, +line2, +col);
    }
    const parts = chromeRegex.exec(line);
    if (parts) {
      const isEval = parts[2] && parts[2].indexOf("eval") === 0;
      if (isEval) {
        const subMatch = chromeEvalRegex.exec(parts[2]);
        if (subMatch) {
          parts[2] = subMatch[1];
          parts[3] = subMatch[2];
          parts[4] = subMatch[3];
        }
      }
      const [func, filename] = extractSafariExtensionDetails(parts[1] || UNKNOWN_FUNCTION, parts[2]);
      return createFrame(filename, func, parts[3] ? +parts[3] : void 0, parts[4] ? +parts[4] : void 0);
    }
    return;
  };
  var chromeStackLineParser = [CHROME_PRIORITY, chromeStackParserFn];
  var geckoREgex = /^\s*(.*?)(?:\((.*?)\))?(?:^|@)?((?:[-a-z]+)?:\/.*?|\[native code\]|[^@]*(?:bundle|\d+\.js)|\/[\w\-. /=]+)(?::(\d+))?(?::(\d+))?\s*$/i;
  var geckoEvalRegex = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i;
  var gecko = (line) => {
    const parts = geckoREgex.exec(line);
    if (parts) {
      const isEval = parts[3] && parts[3].indexOf(" > eval") > -1;
      if (isEval) {
        const subMatch = geckoEvalRegex.exec(parts[3]);
        if (subMatch) {
          parts[1] = parts[1] || "eval";
          parts[3] = subMatch[1];
          parts[4] = subMatch[2];
          parts[5] = "";
        }
      }
      let filename = parts[3];
      let func = parts[1] || UNKNOWN_FUNCTION;
      [func, filename] = extractSafariExtensionDetails(func, filename);
      return createFrame(filename, func, parts[4] ? +parts[4] : void 0, parts[5] ? +parts[5] : void 0);
    }
    return;
  };
  var geckoStackLineParser = [GECKO_PRIORITY, gecko];
  var defaultStackLineParsers = [chromeStackLineParser, geckoStackLineParser];
  var defaultStackParser = createStackParser(...defaultStackLineParsers);
  var extractSafariExtensionDetails = (func, filename) => {
    const isSafariExtension = func.indexOf("safari-extension") !== -1;
    const isSafariWebExtension = func.indexOf("safari-web-extension") !== -1;
    return isSafariExtension || isSafariWebExtension ? [
      func.indexOf("@") !== -1 ? func.split("@")[0] : UNKNOWN_FUNCTION,
      isSafariExtension ? `safari-extension:${filename}` : `safari-web-extension:${filename}`
    ] : [func, filename];
  };

  // ../../node_modules/@sentry/browser/build/npm/esm/debug-build.js
  var DEBUG_BUILD4 = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;

  // ../../node_modules/@sentry/browser/build/npm/esm/integrations/breadcrumbs.js
  var MAX_ALLOWED_STRING_LENGTH = 1024;
  var INTEGRATION_NAME4 = "Breadcrumbs";
  var _breadcrumbsIntegration = (options = {}) => {
    const _options = {
      console: true,
      dom: true,
      fetch: true,
      history: true,
      sentry: true,
      xhr: true,
      ...options
    };
    return {
      name: INTEGRATION_NAME4,
      setup(client) {
        if (_options.console) {
          addConsoleInstrumentationHandler(_getConsoleBreadcrumbHandler(client));
        }
        if (_options.dom) {
          addClickKeypressInstrumentationHandler(_getDomBreadcrumbHandler(client, _options.dom));
        }
        if (_options.xhr) {
          addXhrInstrumentationHandler(_getXhrBreadcrumbHandler(client));
        }
        if (_options.fetch) {
          addFetchInstrumentationHandler(_getFetchBreadcrumbHandler(client));
        }
        if (_options.history) {
          addHistoryInstrumentationHandler(_getHistoryBreadcrumbHandler(client));
        }
        if (_options.sentry) {
          client.on("beforeSendEvent", _getSentryBreadcrumbHandler(client));
        }
      }
    };
  };
  var breadcrumbsIntegration = defineIntegration(_breadcrumbsIntegration);
  function _getSentryBreadcrumbHandler(client) {
    return function addSentryBreadcrumb(event) {
      if (getClient() !== client) {
        return;
      }
      addBreadcrumb(
        {
          category: `sentry.${event.type === "transaction" ? "transaction" : "event"}`,
          event_id: event.event_id,
          level: event.level,
          message: getEventDescription(event)
        },
        {
          event
        }
      );
    };
  }
  function _getDomBreadcrumbHandler(client, dom) {
    return function _innerDomBreadcrumb(handlerData) {
      if (getClient() !== client) {
        return;
      }
      let target;
      let componentName;
      let keyAttrs = typeof dom === "object" ? dom.serializeAttribute : void 0;
      let maxStringLength = typeof dom === "object" && typeof dom.maxStringLength === "number" ? dom.maxStringLength : void 0;
      if (maxStringLength && maxStringLength > MAX_ALLOWED_STRING_LENGTH) {
        DEBUG_BUILD4 && logger.warn(
          `\`dom.maxStringLength\` cannot exceed ${MAX_ALLOWED_STRING_LENGTH}, but a value of ${maxStringLength} was configured. Sentry will use ${MAX_ALLOWED_STRING_LENGTH} instead.`
        );
        maxStringLength = MAX_ALLOWED_STRING_LENGTH;
      }
      if (typeof keyAttrs === "string") {
        keyAttrs = [keyAttrs];
      }
      try {
        const event = handlerData.event;
        const element = _isEvent(event) ? event.target : event;
        target = htmlTreeAsString(element, { keyAttrs, maxStringLength });
        componentName = getComponentName(element);
      } catch (e) {
        target = "<unknown>";
      }
      if (target.length === 0) {
        return;
      }
      const breadcrumb = {
        category: `ui.${handlerData.name}`,
        message: target
      };
      if (componentName) {
        breadcrumb.data = { "ui.component_name": componentName };
      }
      addBreadcrumb(breadcrumb, {
        event: handlerData.event,
        name: handlerData.name,
        global: handlerData.global
      });
    };
  }
  function _getConsoleBreadcrumbHandler(client) {
    return function _consoleBreadcrumb(handlerData) {
      if (getClient() !== client) {
        return;
      }
      const breadcrumb = {
        category: "console",
        data: {
          arguments: handlerData.args,
          logger: "console"
        },
        level: severityLevelFromString(handlerData.level),
        message: safeJoin(handlerData.args, " ")
      };
      if (handlerData.level === "assert") {
        if (handlerData.args[0] === false) {
          breadcrumb.message = `Assertion failed: ${safeJoin(handlerData.args.slice(1), " ") || "console.assert"}`;
          breadcrumb.data.arguments = handlerData.args.slice(1);
        } else {
          return;
        }
      }
      addBreadcrumb(breadcrumb, {
        input: handlerData.args,
        level: handlerData.level
      });
    };
  }
  function _getXhrBreadcrumbHandler(client) {
    return function _xhrBreadcrumb(handlerData) {
      if (getClient() !== client) {
        return;
      }
      const { startTimestamp, endTimestamp } = handlerData;
      const sentryXhrData = handlerData.xhr[SENTRY_XHR_DATA_KEY];
      if (!startTimestamp || !endTimestamp || !sentryXhrData) {
        return;
      }
      const { method, url, status_code, body } = sentryXhrData;
      const data = {
        method,
        url,
        status_code
      };
      const hint = {
        xhr: handlerData.xhr,
        input: body,
        startTimestamp,
        endTimestamp
      };
      const breadcrumb = {
        category: "xhr",
        data,
        type: "http",
        level: getBreadcrumbLogLevelFromHttpStatusCode(status_code)
      };
      client.emit("beforeOutgoingRequestBreadcrumb", breadcrumb, hint);
      addBreadcrumb(breadcrumb, hint);
    };
  }
  function _getFetchBreadcrumbHandler(client) {
    return function _fetchBreadcrumb(handlerData) {
      if (getClient() !== client) {
        return;
      }
      const { startTimestamp, endTimestamp } = handlerData;
      if (!endTimestamp) {
        return;
      }
      if (handlerData.fetchData.url.match(/sentry_key/) && handlerData.fetchData.method === "POST") {
        return;
      }
      ({
        method: handlerData.fetchData.method,
        url: handlerData.fetchData.url
      });
      if (handlerData.error) {
        const data = handlerData.fetchData;
        const hint = {
          data: handlerData.error,
          input: handlerData.args,
          startTimestamp,
          endTimestamp
        };
        const breadcrumb = {
          category: "fetch",
          data,
          level: "error",
          type: "http"
        };
        client.emit("beforeOutgoingRequestBreadcrumb", breadcrumb, hint);
        addBreadcrumb(breadcrumb, hint);
      } else {
        const response = handlerData.response;
        const data = {
          ...handlerData.fetchData,
          status_code: response?.status
        };
        handlerData.fetchData.request_body_size;
        handlerData.fetchData.response_body_size;
        response?.status;
        const hint = {
          input: handlerData.args,
          response,
          startTimestamp,
          endTimestamp
        };
        const breadcrumb = {
          category: "fetch",
          data,
          type: "http",
          level: getBreadcrumbLogLevelFromHttpStatusCode(data.status_code)
        };
        client.emit("beforeOutgoingRequestBreadcrumb", breadcrumb, hint);
        addBreadcrumb(breadcrumb, hint);
      }
    };
  }
  function _getHistoryBreadcrumbHandler(client) {
    return function _historyBreadcrumb(handlerData) {
      if (getClient() !== client) {
        return;
      }
      let from = handlerData.from;
      let to = handlerData.to;
      const parsedLoc = parseUrl(WINDOW3.location.href);
      let parsedFrom = from ? parseUrl(from) : void 0;
      const parsedTo = parseUrl(to);
      if (!parsedFrom?.path) {
        parsedFrom = parsedLoc;
      }
      if (parsedLoc.protocol === parsedTo.protocol && parsedLoc.host === parsedTo.host) {
        to = parsedTo.relative;
      }
      if (parsedLoc.protocol === parsedFrom.protocol && parsedLoc.host === parsedFrom.host) {
        from = parsedFrom.relative;
      }
      addBreadcrumb({
        category: "navigation",
        data: {
          from,
          to
        }
      });
    };
  }
  function _isEvent(event) {
    return !!event && !!event.target;
  }

  // ../../node_modules/@sentry/browser/build/npm/esm/integrations/browserapierrors.js
  var DEFAULT_EVENT_TARGET = [
    "EventTarget",
    "Window",
    "Node",
    "ApplicationCache",
    "AudioTrackList",
    "BroadcastChannel",
    "ChannelMergerNode",
    "CryptoOperation",
    "EventSource",
    "FileReader",
    "HTMLUnknownElement",
    "IDBDatabase",
    "IDBRequest",
    "IDBTransaction",
    "KeyOperation",
    "MediaController",
    "MessagePort",
    "ModalWindow",
    "Notification",
    "SVGElementInstance",
    "Screen",
    "SharedWorker",
    "TextTrack",
    "TextTrackCue",
    "TextTrackList",
    "WebSocket",
    "WebSocketWorker",
    "Worker",
    "XMLHttpRequest",
    "XMLHttpRequestEventTarget",
    "XMLHttpRequestUpload"
  ];
  var INTEGRATION_NAME5 = "BrowserApiErrors";
  var _browserApiErrorsIntegration = (options = {}) => {
    const _options = {
      XMLHttpRequest: true,
      eventTarget: true,
      requestAnimationFrame: true,
      setInterval: true,
      setTimeout: true,
      ...options
    };
    return {
      name: INTEGRATION_NAME5,
      // TODO: This currently only works for the first client this is setup
      // We may want to adjust this to check for client etc.
      setupOnce() {
        if (_options.setTimeout) {
          fill(WINDOW3, "setTimeout", _wrapTimeFunction);
        }
        if (_options.setInterval) {
          fill(WINDOW3, "setInterval", _wrapTimeFunction);
        }
        if (_options.requestAnimationFrame) {
          fill(WINDOW3, "requestAnimationFrame", _wrapRAF);
        }
        if (_options.XMLHttpRequest && "XMLHttpRequest" in WINDOW3) {
          fill(XMLHttpRequest.prototype, "send", _wrapXHR);
        }
        const eventTargetOption = _options.eventTarget;
        if (eventTargetOption) {
          const eventTarget = Array.isArray(eventTargetOption) ? eventTargetOption : DEFAULT_EVENT_TARGET;
          eventTarget.forEach(_wrapEventTarget);
        }
      }
    };
  };
  var browserApiErrorsIntegration = defineIntegration(_browserApiErrorsIntegration);
  function _wrapTimeFunction(original) {
    return function(...args) {
      const originalCallback = args[0];
      args[0] = wrap(originalCallback, {
        mechanism: {
          data: { function: getFunctionName(original) },
          handled: false,
          type: "instrument"
        }
      });
      return original.apply(this, args);
    };
  }
  function _wrapRAF(original) {
    return function(callback) {
      return original.apply(this, [
        wrap(callback, {
          mechanism: {
            data: {
              function: "requestAnimationFrame",
              handler: getFunctionName(original)
            },
            handled: false,
            type: "instrument"
          }
        })
      ]);
    };
  }
  function _wrapXHR(originalSend) {
    return function(...args) {
      const xhr = this;
      const xmlHttpRequestProps = ["onload", "onerror", "onprogress", "onreadystatechange"];
      xmlHttpRequestProps.forEach((prop) => {
        if (prop in xhr && typeof xhr[prop] === "function") {
          fill(xhr, prop, function(original) {
            const wrapOptions = {
              mechanism: {
                data: {
                  function: prop,
                  handler: getFunctionName(original)
                },
                handled: false,
                type: "instrument"
              }
            };
            const originalFunction = getOriginalFunction(original);
            if (originalFunction) {
              wrapOptions.mechanism.data.handler = getFunctionName(originalFunction);
            }
            return wrap(original, wrapOptions);
          });
        }
      });
      return originalSend.apply(this, args);
    };
  }
  function _wrapEventTarget(target) {
    const globalObject = WINDOW3;
    const proto = globalObject[target]?.prototype;
    if (!proto?.hasOwnProperty?.("addEventListener")) {
      return;
    }
    fill(proto, "addEventListener", function(original) {
      return function(eventName, fn, options) {
        try {
          if (isEventListenerObject(fn)) {
            fn.handleEvent = wrap(fn.handleEvent, {
              mechanism: {
                data: {
                  function: "handleEvent",
                  handler: getFunctionName(fn),
                  target
                },
                handled: false,
                type: "instrument"
              }
            });
          }
        } catch {
        }
        return original.apply(this, [
          eventName,
          wrap(fn, {
            mechanism: {
              data: {
                function: "addEventListener",
                handler: getFunctionName(fn),
                target
              },
              handled: false,
              type: "instrument"
            }
          }),
          options
        ]);
      };
    });
    fill(proto, "removeEventListener", function(originalRemoveEventListener) {
      return function(eventName, fn, options) {
        try {
          const originalEventHandler = fn.__sentry_wrapped__;
          if (originalEventHandler) {
            originalRemoveEventListener.call(this, eventName, originalEventHandler, options);
          }
        } catch (e) {
        }
        return originalRemoveEventListener.call(this, eventName, fn, options);
      };
    });
  }
  function isEventListenerObject(obj) {
    return typeof obj.handleEvent === "function";
  }

  // ../../node_modules/@sentry/browser/build/npm/esm/integrations/browsersession.js
  var browserSessionIntegration = defineIntegration(() => {
    return {
      name: "BrowserSession",
      setupOnce() {
        if (typeof WINDOW3.document === "undefined") {
          DEBUG_BUILD4 && logger.warn("Using the `browserSessionIntegration` in non-browser environments is not supported.");
          return;
        }
        startSession({ ignoreDuration: true });
        captureSession();
        addHistoryInstrumentationHandler(({ from, to }) => {
          if (from !== void 0 && from !== to) {
            startSession({ ignoreDuration: true });
            captureSession();
          }
        });
      }
    };
  });

  // ../../node_modules/@sentry/browser/build/npm/esm/integrations/globalhandlers.js
  var INTEGRATION_NAME6 = "GlobalHandlers";
  var _globalHandlersIntegration = (options = {}) => {
    const _options = {
      onerror: true,
      onunhandledrejection: true,
      ...options
    };
    return {
      name: INTEGRATION_NAME6,
      setupOnce() {
        Error.stackTraceLimit = 50;
      },
      setup(client) {
        if (_options.onerror) {
          _installGlobalOnErrorHandler(client);
          globalHandlerLog("onerror");
        }
        if (_options.onunhandledrejection) {
          _installGlobalOnUnhandledRejectionHandler(client);
          globalHandlerLog("onunhandledrejection");
        }
      }
    };
  };
  var globalHandlersIntegration = defineIntegration(_globalHandlersIntegration);
  function _installGlobalOnErrorHandler(client) {
    addGlobalErrorInstrumentationHandler((data) => {
      const { stackParser, attachStacktrace } = getOptions();
      if (getClient() !== client || shouldIgnoreOnError()) {
        return;
      }
      const { msg, url, line, column, error } = data;
      const event = _enhanceEventWithInitialFrame(
        eventFromUnknownInput(stackParser, error || msg, void 0, attachStacktrace, false),
        url,
        line,
        column
      );
      event.level = "error";
      captureEvent(event, {
        originalException: error,
        mechanism: {
          handled: false,
          type: "onerror"
        }
      });
    });
  }
  function _installGlobalOnUnhandledRejectionHandler(client) {
    addGlobalUnhandledRejectionInstrumentationHandler((e) => {
      const { stackParser, attachStacktrace } = getOptions();
      if (getClient() !== client || shouldIgnoreOnError()) {
        return;
      }
      const error = _getUnhandledRejectionError(e);
      const event = isPrimitive(error) ? _eventFromRejectionWithPrimitive(error) : eventFromUnknownInput(stackParser, error, void 0, attachStacktrace, true);
      event.level = "error";
      captureEvent(event, {
        originalException: error,
        mechanism: {
          handled: false,
          type: "onunhandledrejection"
        }
      });
    });
  }
  function _getUnhandledRejectionError(error) {
    if (isPrimitive(error)) {
      return error;
    }
    try {
      if ("reason" in error) {
        return error.reason;
      }
      if ("detail" in error && "reason" in error.detail) {
        return error.detail.reason;
      }
    } catch {
    }
    return error;
  }
  function _eventFromRejectionWithPrimitive(reason) {
    return {
      exception: {
        values: [
          {
            type: "UnhandledRejection",
            // String() is needed because the Primitive type includes symbols (which can't be automatically stringified)
            value: `Non-Error promise rejection captured with value: ${String(reason)}`
          }
        ]
      }
    };
  }
  function _enhanceEventWithInitialFrame(event, url, line, column) {
    const e = event.exception = event.exception || {};
    const ev = e.values = e.values || [];
    const ev0 = ev[0] = ev[0] || {};
    const ev0s = ev0.stacktrace = ev0.stacktrace || {};
    const ev0sf = ev0s.frames = ev0s.frames || [];
    const colno = column;
    const lineno = line;
    const filename = isString(url) && url.length > 0 ? url : getLocationHref();
    if (ev0sf.length === 0) {
      ev0sf.push({
        colno,
        filename,
        function: UNKNOWN_FUNCTION,
        in_app: true,
        lineno
      });
    }
    return event;
  }
  function globalHandlerLog(type) {
    DEBUG_BUILD4 && logger.log(`Global Handler attached: ${type}`);
  }
  function getOptions() {
    const client = getClient();
    const options = client?.getOptions() || {
      stackParser: () => [],
      attachStacktrace: false
    };
    return options;
  }

  // ../../node_modules/@sentry/browser/build/npm/esm/integrations/httpcontext.js
  var httpContextIntegration = defineIntegration(() => {
    return {
      name: "HttpContext",
      preprocessEvent(event) {
        if (!WINDOW3.navigator && !WINDOW3.location && !WINDOW3.document) {
          return;
        }
        const url = event.request?.url || getLocationHref();
        const { referrer } = WINDOW3.document || {};
        const { userAgent } = WINDOW3.navigator || {};
        const headers = {
          ...event.request?.headers,
          ...referrer && { Referer: referrer },
          ...userAgent && { "User-Agent": userAgent }
        };
        const request = {
          ...event.request,
          ...url && { url },
          headers
        };
        event.request = request;
      }
    };
  });

  // ../../node_modules/@sentry/browser/build/npm/esm/integrations/linkederrors.js
  var DEFAULT_KEY = "cause";
  var DEFAULT_LIMIT = 5;
  var INTEGRATION_NAME7 = "LinkedErrors";
  var _linkedErrorsIntegration = (options = {}) => {
    const limit = options.limit || DEFAULT_LIMIT;
    const key = options.key || DEFAULT_KEY;
    return {
      name: INTEGRATION_NAME7,
      preprocessEvent(event, hint, client) {
        const options2 = client.getOptions();
        applyAggregateErrorsToEvent(
          // This differs from the LinkedErrors integration in core by using a different exceptionFromError function
          exceptionFromError,
          options2.stackParser,
          options2.maxValueLength,
          key,
          limit,
          event,
          hint
        );
      }
    };
  };
  var linkedErrorsIntegration = defineIntegration(_linkedErrorsIntegration);

  // ../../node_modules/@sentry/browser/build/npm/esm/sdk.js
  function getDefaultIntegrations(_options) {
    return [
      inboundFiltersIntegration(),
      functionToStringIntegration(),
      browserApiErrorsIntegration(),
      breadcrumbsIntegration(),
      globalHandlersIntegration(),
      linkedErrorsIntegration(),
      dedupeIntegration(),
      httpContextIntegration(),
      browserSessionIntegration()
    ];
  }
  function applyDefaultOptions(optionsArg = {}) {
    const defaultOptions = {
      defaultIntegrations: getDefaultIntegrations(),
      release: typeof __SENTRY_RELEASE__ === "string" ? __SENTRY_RELEASE__ : WINDOW3.SENTRY_RELEASE?.id,
      // This supports the variable that sentry-webpack-plugin injects
      sendClientReports: true
    };
    return {
      ...defaultOptions,
      ...dropTopLevelUndefinedKeys(optionsArg)
    };
  }
  function dropTopLevelUndefinedKeys(obj) {
    const mutatetedObj = {};
    for (const k of Object.getOwnPropertyNames(obj)) {
      const key = k;
      if (obj[key] !== void 0) {
        mutatetedObj[key] = obj[key];
      }
    }
    return mutatetedObj;
  }
  function shouldShowBrowserExtensionError() {
    const windowWithMaybeExtension = typeof WINDOW3.window !== "undefined" && WINDOW3;
    if (!windowWithMaybeExtension) {
      return false;
    }
    const extensionKey = windowWithMaybeExtension.chrome ? "chrome" : "browser";
    const extensionObject = windowWithMaybeExtension[extensionKey];
    const runtimeId = extensionObject?.runtime?.id;
    const href = getLocationHref() || "";
    const extensionProtocols = ["chrome-extension:", "moz-extension:", "ms-browser-extension:", "safari-web-extension:"];
    const isDedicatedExtensionPage = !!runtimeId && WINDOW3 === WINDOW3.top && extensionProtocols.some((protocol) => href.startsWith(`${protocol}//`));
    const isNWjs = typeof windowWithMaybeExtension.nw !== "undefined";
    return !!runtimeId && !isDedicatedExtensionPage && !isNWjs;
  }
  function init(browserOptions = {}) {
    const options = applyDefaultOptions(browserOptions);
    if (!options.skipBrowserExtensionCheck && shouldShowBrowserExtensionError()) {
      if (DEBUG_BUILD4) {
        consoleSandbox(() => {
          console.error(
            "[Sentry] You cannot run Sentry this way in a browser extension, check: https://docs.sentry.io/platforms/javascript/best-practices/browser-extensions/"
          );
        });
      }
      return;
    }
    if (DEBUG_BUILD4 && !supportsFetch()) {
      logger.warn(
        "No Fetch API detected. The Sentry SDK requires a Fetch API compatible environment to send events. Please add a Fetch API polyfill."
      );
    }
    const clientOptions = {
      ...options,
      stackParser: stackParserFromStackParserOptions(options.stackParser || defaultStackParser),
      integrations: getIntegrationsToSetup(options),
      transport: options.transport || makeFetchTransport
    };
    return initAndBind(BrowserClient, clientOptions);
  }

  // ../../node_modules/@sentry/browser/build/npm/esm/tracing/request.js
  var responseToSpanId = /* @__PURE__ */ new WeakMap();
  var spanIdToEndTimestamp = /* @__PURE__ */ new Map();
  var defaultRequestInstrumentationOptions = {
    traceFetch: true,
    traceXHR: true,
    enableHTTPTimings: true,
    trackFetchStreamPerformance: false
  };
  function instrumentOutgoingRequests(client, _options) {
    const {
      traceFetch,
      traceXHR,
      trackFetchStreamPerformance,
      shouldCreateSpanForRequest,
      enableHTTPTimings,
      tracePropagationTargets
    } = {
      traceFetch: defaultRequestInstrumentationOptions.traceFetch,
      traceXHR: defaultRequestInstrumentationOptions.traceXHR,
      trackFetchStreamPerformance: defaultRequestInstrumentationOptions.trackFetchStreamPerformance,
      ..._options
    };
    const shouldCreateSpan = typeof shouldCreateSpanForRequest === "function" ? shouldCreateSpanForRequest : (_) => true;
    const shouldAttachHeadersWithTargets = (url) => shouldAttachHeaders(url, tracePropagationTargets);
    const spans = {};
    if (traceFetch) {
      client.addEventProcessor((event) => {
        if (event.type === "transaction" && event.spans) {
          event.spans.forEach((span) => {
            if (span.op === "http.client") {
              const updatedTimestamp = spanIdToEndTimestamp.get(span.span_id);
              if (updatedTimestamp) {
                span.timestamp = updatedTimestamp / 1e3;
                spanIdToEndTimestamp.delete(span.span_id);
              }
            }
          });
        }
        return event;
      });
      if (trackFetchStreamPerformance) {
        addFetchEndInstrumentationHandler((handlerData) => {
          if (handlerData.response) {
            const span = responseToSpanId.get(handlerData.response);
            if (span && handlerData.endTimestamp) {
              spanIdToEndTimestamp.set(span, handlerData.endTimestamp);
            }
          }
        });
      }
      addFetchInstrumentationHandler((handlerData) => {
        const createdSpan = instrumentFetchRequest(handlerData, shouldCreateSpan, shouldAttachHeadersWithTargets, spans);
        if (handlerData.response && handlerData.fetchData.__span) {
          responseToSpanId.set(handlerData.response, handlerData.fetchData.__span);
        }
        if (createdSpan) {
          const fullUrl = getFullURL2(handlerData.fetchData.url);
          const host = fullUrl ? parseUrl(fullUrl).host : void 0;
          createdSpan.setAttributes({
            "http.url": fullUrl,
            "server.address": host
          });
        }
        if (enableHTTPTimings && createdSpan) {
          addHTTPTimings(createdSpan);
        }
      });
    }
    if (traceXHR) {
      addXhrInstrumentationHandler((handlerData) => {
        const createdSpan = xhrCallback(handlerData, shouldCreateSpan, shouldAttachHeadersWithTargets, spans);
        if (enableHTTPTimings && createdSpan) {
          addHTTPTimings(createdSpan);
        }
      });
    }
  }
  function isPerformanceResourceTiming(entry) {
    return entry.entryType === "resource" && "initiatorType" in entry && typeof entry.nextHopProtocol === "string" && (entry.initiatorType === "fetch" || entry.initiatorType === "xmlhttprequest");
  }
  function addHTTPTimings(span) {
    const { url } = spanToJSON(span).data;
    if (!url || typeof url !== "string") {
      return;
    }
    const cleanup = addPerformanceInstrumentationHandler("resource", ({ entries }) => {
      entries.forEach((entry) => {
        if (isPerformanceResourceTiming(entry) && entry.name.endsWith(url)) {
          const spanData = resourceTimingEntryToSpanData(entry);
          spanData.forEach((data) => span.setAttribute(...data));
          setTimeout(cleanup);
        }
      });
    });
  }
  function getAbsoluteTime(time = 0) {
    return ((browserPerformanceTimeOrigin() || performance.timeOrigin) + time) / 1e3;
  }
  function resourceTimingEntryToSpanData(resourceTiming) {
    const { name, version } = extractNetworkProtocol(resourceTiming.nextHopProtocol);
    const timingSpanData = [];
    timingSpanData.push(["network.protocol.version", version], ["network.protocol.name", name]);
    if (!browserPerformanceTimeOrigin()) {
      return timingSpanData;
    }
    return [
      ...timingSpanData,
      ["http.request.redirect_start", getAbsoluteTime(resourceTiming.redirectStart)],
      ["http.request.fetch_start", getAbsoluteTime(resourceTiming.fetchStart)],
      ["http.request.domain_lookup_start", getAbsoluteTime(resourceTiming.domainLookupStart)],
      ["http.request.domain_lookup_end", getAbsoluteTime(resourceTiming.domainLookupEnd)],
      ["http.request.connect_start", getAbsoluteTime(resourceTiming.connectStart)],
      ["http.request.secure_connection_start", getAbsoluteTime(resourceTiming.secureConnectionStart)],
      ["http.request.connection_end", getAbsoluteTime(resourceTiming.connectEnd)],
      ["http.request.request_start", getAbsoluteTime(resourceTiming.requestStart)],
      ["http.request.response_start", getAbsoluteTime(resourceTiming.responseStart)],
      ["http.request.response_end", getAbsoluteTime(resourceTiming.responseEnd)]
    ];
  }
  function shouldAttachHeaders(targetUrl, tracePropagationTargets) {
    const href = getLocationHref();
    if (!href) {
      const isRelativeSameOriginRequest = !!targetUrl.match(/^\/(?!\/)/);
      if (!tracePropagationTargets) {
        return isRelativeSameOriginRequest;
      } else {
        return stringMatchesSomePattern(targetUrl, tracePropagationTargets);
      }
    } else {
      let resolvedUrl;
      let currentOrigin;
      try {
        resolvedUrl = new URL(targetUrl, href);
        currentOrigin = new URL(href).origin;
      } catch (e) {
        return false;
      }
      const isSameOriginRequest = resolvedUrl.origin === currentOrigin;
      if (!tracePropagationTargets) {
        return isSameOriginRequest;
      } else {
        return stringMatchesSomePattern(resolvedUrl.toString(), tracePropagationTargets) || isSameOriginRequest && stringMatchesSomePattern(resolvedUrl.pathname, tracePropagationTargets);
      }
    }
  }
  function xhrCallback(handlerData, shouldCreateSpan, shouldAttachHeaders2, spans) {
    const xhr = handlerData.xhr;
    const sentryXhrData = xhr?.[SENTRY_XHR_DATA_KEY];
    if (!xhr || xhr.__sentry_own_request__ || !sentryXhrData) {
      return void 0;
    }
    const { url, method } = sentryXhrData;
    const shouldCreateSpanResult = hasSpansEnabled() && shouldCreateSpan(url);
    if (handlerData.endTimestamp && shouldCreateSpanResult) {
      const spanId = xhr.__sentry_xhr_span_id__;
      if (!spanId) return;
      const span2 = spans[spanId];
      if (span2 && sentryXhrData.status_code !== void 0) {
        setHttpStatus(span2, sentryXhrData.status_code);
        span2.end();
        delete spans[spanId];
      }
      return void 0;
    }
    const fullUrl = getFullURL2(url);
    const parsedUrl = fullUrl ? parseUrl(fullUrl) : parseUrl(url);
    const urlForSpanName = stripUrlQueryAndFragment(url);
    const hasParent = !!getActiveSpan();
    const span = shouldCreateSpanResult && hasParent ? startInactiveSpan({
      name: `${method} ${urlForSpanName}`,
      attributes: {
        url,
        type: "xhr",
        "http.method": method,
        "http.url": fullUrl,
        "server.address": parsedUrl?.host,
        [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.browser",
        [SEMANTIC_ATTRIBUTE_SENTRY_OP]: "http.client",
        ...parsedUrl?.search && { "http.query": parsedUrl?.search },
        ...parsedUrl?.hash && { "http.fragment": parsedUrl?.hash }
      }
    }) : new SentryNonRecordingSpan();
    xhr.__sentry_xhr_span_id__ = span.spanContext().spanId;
    spans[xhr.__sentry_xhr_span_id__] = span;
    if (shouldAttachHeaders2(url)) {
      addTracingHeadersToXhrRequest(
        xhr,
        // If performance is disabled (TWP) or there's no active root span (pageload/navigation/interaction),
        // we do not want to use the span as base for the trace headers,
        // which means that the headers will be generated from the scope and the sampling decision is deferred
        hasSpansEnabled() && hasParent ? span : void 0
      );
    }
    const client = getClient();
    if (client) {
      client.emit("beforeOutgoingRequestSpan", span, handlerData);
    }
    return span;
  }
  function addTracingHeadersToXhrRequest(xhr, span) {
    const { "sentry-trace": sentryTrace, baggage } = getTraceData({ span });
    if (sentryTrace) {
      setHeaderOnXhr(xhr, sentryTrace, baggage);
    }
  }
  function setHeaderOnXhr(xhr, sentryTraceHeader, sentryBaggageHeader) {
    try {
      xhr.setRequestHeader("sentry-trace", sentryTraceHeader);
      if (sentryBaggageHeader) {
        xhr.setRequestHeader("baggage", sentryBaggageHeader);
      }
    } catch (_) {
    }
  }
  function getFullURL2(url) {
    try {
      const parsed = new URL(url, WINDOW3.location.origin);
      return parsed.href;
    } catch {
      return void 0;
    }
  }

  // ../../node_modules/@sentry/browser/build/npm/esm/tracing/backgroundtab.js
  function registerBackgroundTabDetection() {
    if (WINDOW3.document) {
      WINDOW3.document.addEventListener("visibilitychange", () => {
        const activeSpan = getActiveSpan();
        if (!activeSpan) {
          return;
        }
        const rootSpan = getRootSpan(activeSpan);
        if (WINDOW3.document.hidden && rootSpan) {
          const cancelledStatus = "cancelled";
          const { op, status } = spanToJSON(rootSpan);
          if (DEBUG_BUILD4) {
            logger.log(`[Tracing] Transaction: ${cancelledStatus} -> since tab moved to the background, op: ${op}`);
          }
          if (!status) {
            rootSpan.setStatus({ code: SPAN_STATUS_ERROR, message: cancelledStatus });
          }
          rootSpan.setAttribute("sentry.cancellation_reason", "document.hidden");
          rootSpan.end();
        }
      });
    } else {
      DEBUG_BUILD4 && logger.warn("[Tracing] Could not set up background tab detection due to lack of global document");
    }
  }

  // ../../node_modules/@sentry/browser/build/npm/esm/tracing/browserTracingIntegration.js
  var BROWSER_TRACING_INTEGRATION_ID = "BrowserTracing";
  var DEFAULT_BROWSER_TRACING_OPTIONS = {
    ...TRACING_DEFAULTS,
    instrumentNavigation: true,
    instrumentPageLoad: true,
    markBackgroundSpan: true,
    enableLongTask: true,
    enableLongAnimationFrame: true,
    enableInp: true,
    _experiments: {},
    ...defaultRequestInstrumentationOptions
  };
  var browserTracingIntegration = (_options = {}) => {
    const optionalWindowDocument = WINDOW3.document;
    registerSpanErrorInstrumentation();
    const {
      enableInp,
      enableLongTask,
      enableLongAnimationFrame,
      _experiments: { enableInteractions, enableStandaloneClsSpans },
      beforeStartSpan,
      idleTimeout,
      finalTimeout,
      childSpanTimeout,
      markBackgroundSpan,
      traceFetch,
      traceXHR,
      trackFetchStreamPerformance,
      shouldCreateSpanForRequest,
      enableHTTPTimings,
      instrumentPageLoad,
      instrumentNavigation
    } = {
      ...DEFAULT_BROWSER_TRACING_OPTIONS,
      ..._options
    };
    const _collectWebVitals = startTrackingWebVitals({ recordClsStandaloneSpans: enableStandaloneClsSpans || false });
    if (enableInp) {
      startTrackingINP();
    }
    if (enableLongAnimationFrame && GLOBAL_OBJ.PerformanceObserver && PerformanceObserver.supportedEntryTypes && PerformanceObserver.supportedEntryTypes.includes("long-animation-frame")) {
      startTrackingLongAnimationFrames();
    } else if (enableLongTask) {
      startTrackingLongTasks();
    }
    if (enableInteractions) {
      startTrackingInteractions();
    }
    const latestRoute = {
      name: void 0,
      source: void 0
    };
    function _createRouteSpan(client, startSpanOptions) {
      const isPageloadTransaction = startSpanOptions.op === "pageload";
      const finalStartSpanOptions = beforeStartSpan ? beforeStartSpan(startSpanOptions) : startSpanOptions;
      const attributes = finalStartSpanOptions.attributes || {};
      if (startSpanOptions.name !== finalStartSpanOptions.name) {
        attributes[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE] = "custom";
        finalStartSpanOptions.attributes = attributes;
      }
      latestRoute.name = finalStartSpanOptions.name;
      latestRoute.source = attributes[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE];
      const idleSpan = startIdleSpan(finalStartSpanOptions, {
        idleTimeout,
        finalTimeout,
        childSpanTimeout,
        // should wait for finish signal if it's a pageload transaction
        disableAutoFinish: isPageloadTransaction,
        beforeSpanEnd: (span) => {
          _collectWebVitals();
          addPerformanceEntries(span, { recordClsOnPageloadSpan: !enableStandaloneClsSpans });
          setActiveIdleSpan(client, void 0);
          const scope = getCurrentScope();
          const oldPropagationContext = scope.getPropagationContext();
          scope.setPropagationContext({
            ...oldPropagationContext,
            traceId: idleSpan.spanContext().traceId,
            sampled: spanIsSampled(idleSpan),
            dsc: getDynamicSamplingContextFromSpan(span)
          });
        }
      });
      setActiveIdleSpan(client, idleSpan);
      function emitFinish() {
        if (optionalWindowDocument && ["interactive", "complete"].includes(optionalWindowDocument.readyState)) {
          client.emit("idleSpanEnableAutoFinish", idleSpan);
        }
      }
      if (isPageloadTransaction && optionalWindowDocument) {
        optionalWindowDocument.addEventListener("readystatechange", () => {
          emitFinish();
        });
        emitFinish();
      }
    }
    return {
      name: BROWSER_TRACING_INTEGRATION_ID,
      afterAllSetup(client) {
        let startingUrl = getLocationHref();
        function maybeEndActiveSpan() {
          const activeSpan = getActiveIdleSpan(client);
          if (activeSpan && !spanToJSON(activeSpan).timestamp) {
            DEBUG_BUILD4 && logger.log(`[Tracing] Finishing current active span with op: ${spanToJSON(activeSpan).op}`);
            activeSpan.end();
          }
        }
        client.on("startNavigationSpan", (startSpanOptions) => {
          if (getClient() !== client) {
            return;
          }
          maybeEndActiveSpan();
          getIsolationScope().setPropagationContext({ traceId: generateTraceId(), sampleRand: Math.random() });
          getCurrentScope().setPropagationContext({ traceId: generateTraceId(), sampleRand: Math.random() });
          _createRouteSpan(client, {
            op: "navigation",
            ...startSpanOptions
          });
        });
        client.on("startPageLoadSpan", (startSpanOptions, traceOptions = {}) => {
          if (getClient() !== client) {
            return;
          }
          maybeEndActiveSpan();
          const sentryTrace = traceOptions.sentryTrace || getMetaContent("sentry-trace");
          const baggage = traceOptions.baggage || getMetaContent("baggage");
          const propagationContext = propagationContextFromHeaders(sentryTrace, baggage);
          getCurrentScope().setPropagationContext(propagationContext);
          _createRouteSpan(client, {
            op: "pageload",
            ...startSpanOptions
          });
        });
        if (WINDOW3.location) {
          if (instrumentPageLoad) {
            const origin = browserPerformanceTimeOrigin();
            startBrowserTracingPageLoadSpan(client, {
              name: WINDOW3.location.pathname,
              // pageload should always start at timeOrigin (and needs to be in s, not ms)
              startTime: origin ? origin / 1e3 : void 0,
              attributes: {
                [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "url",
                [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.pageload.browser"
              }
            });
          }
          if (instrumentNavigation) {
            addHistoryInstrumentationHandler(({ to, from }) => {
              if (from === void 0 && startingUrl?.indexOf(to) !== -1) {
                startingUrl = void 0;
                return;
              }
              if (from !== to) {
                startingUrl = void 0;
                startBrowserTracingNavigationSpan(client, {
                  name: WINDOW3.location.pathname,
                  attributes: {
                    [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "url",
                    [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.navigation.browser"
                  }
                });
              }
            });
          }
        }
        if (markBackgroundSpan) {
          registerBackgroundTabDetection();
        }
        if (enableInteractions) {
          registerInteractionListener(client, idleTimeout, finalTimeout, childSpanTimeout, latestRoute);
        }
        if (enableInp) {
          registerInpInteractionListener();
        }
        instrumentOutgoingRequests(client, {
          traceFetch,
          traceXHR,
          trackFetchStreamPerformance,
          tracePropagationTargets: client.getOptions().tracePropagationTargets,
          shouldCreateSpanForRequest,
          enableHTTPTimings
        });
      }
    };
  };
  function startBrowserTracingPageLoadSpan(client, spanOptions, traceOptions) {
    client.emit("startPageLoadSpan", spanOptions, traceOptions);
    getCurrentScope().setTransactionName(spanOptions.name);
    return getActiveIdleSpan(client);
  }
  function startBrowserTracingNavigationSpan(client, spanOptions) {
    client.emit("startNavigationSpan", spanOptions);
    getCurrentScope().setTransactionName(spanOptions.name);
    return getActiveIdleSpan(client);
  }
  function getMetaContent(metaName) {
    const optionalWindowDocument = WINDOW3.document;
    const metaTag = optionalWindowDocument?.querySelector(`meta[name=${metaName}]`);
    return metaTag?.getAttribute("content") || void 0;
  }
  function registerInteractionListener(client, idleTimeout, finalTimeout, childSpanTimeout, latestRoute) {
    const optionalWindowDocument = WINDOW3.document;
    let inflightInteractionSpan;
    const registerInteractionTransaction = () => {
      const op = "ui.action.click";
      const activeIdleSpan = getActiveIdleSpan(client);
      if (activeIdleSpan) {
        const currentRootSpanOp = spanToJSON(activeIdleSpan).op;
        if (["navigation", "pageload"].includes(currentRootSpanOp)) {
          DEBUG_BUILD4 && logger.warn(`[Tracing] Did not create ${op} span because a pageload or navigation span is in progress.`);
          return void 0;
        }
      }
      if (inflightInteractionSpan) {
        inflightInteractionSpan.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_IDLE_SPAN_FINISH_REASON, "interactionInterrupted");
        inflightInteractionSpan.end();
        inflightInteractionSpan = void 0;
      }
      if (!latestRoute.name) {
        DEBUG_BUILD4 && logger.warn(`[Tracing] Did not create ${op} transaction because _latestRouteName is missing.`);
        return void 0;
      }
      inflightInteractionSpan = startIdleSpan(
        {
          name: latestRoute.name,
          op,
          attributes: {
            [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: latestRoute.source || "url"
          }
        },
        {
          idleTimeout,
          finalTimeout,
          childSpanTimeout
        }
      );
    };
    if (optionalWindowDocument) {
      addEventListener("click", registerInteractionTransaction, { once: false, capture: true });
    }
  }
  var ACTIVE_IDLE_SPAN_PROPERTY = "_sentry_idleSpan";
  function getActiveIdleSpan(client) {
    return client[ACTIVE_IDLE_SPAN_PROPERTY];
  }
  function setActiveIdleSpan(client, span) {
    addNonEnumerableProperty(client, ACTIVE_IDLE_SPAN_PROPERTY, span);
  }

  // sentry.js
  var sentryScript = document.getElementById("sentry-js");
  if (sentryScript && sentryScript.hasAttribute("data-dsn")) {
    init({
      dsn: sentryScript.attributes["data-dsn"].value,
      release: "athena@1.0.0",
      // 'release' is based on latest sprint or upgrade
      integrations: [browserTracingIntegration()],
      tracesSampleRate: parseFloat(sentryScript.attributes["data-traces-sample-rate"].value)
    });
    if (sentryScript.hasAttribute("data-current-account")) {
      setUser(JSON.parse(sentryScript.attributes["data-current-account"].value));
    }
  }
})();
//# sourceMappingURL=sentry.js.map

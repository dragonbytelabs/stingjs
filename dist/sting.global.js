var sting = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // sting/entry/entry-global.js
  var entry_global_exports = {};
  __export(entry_global_exports, {
    default: () => entry_global_default
  });

  // sting/core/index.js
  var core_exports = {};
  __export(core_exports, {
    STING_SIGNAL: () => STING_SIGNAL,
    __DEV__: () => __DEV__,
    assert: () => assert,
    batch: () => batch,
    binders: () => binders,
    computed: () => computed,
    data: () => data,
    devAssert: () => devAssert,
    devWarn: () => devWarn,
    directive: () => directive,
    effect: () => effect,
    elementTag: () => elementTag,
    isPathSafe: () => isPathSafe,
    mountComponent: () => mountComponent,
    onCleanup: () => onCleanup,
    produce: () => produce,
    setIntervalSafe: () => setIntervalSafe,
    setTimeoutSafe: () => setTimeoutSafe,
    signal: () => signal,
    start: () => start,
    startSubtree: () => startSubtree,
    store: () => store,
    unmountComponent: () => unmountComponent,
    untrack: () => untrack,
    unwrap: () => unwrap,
    use: () => use
  });

  // sting/core/utils.js
  var __DEV__ = typeof __DEV__ !== "undefined" ? __DEV__ : true;
  function assert(condition, message, options) {
    if (condition) return;
    const err = (
      /** @type {StingError} */
      new Error(message)
    );
    if (options?.code) err.code = options.code;
    if (options?.cause) err.cause = options.cause;
    throw err;
  }
  function devAssert(condition, message) {
    if (!__DEV__) return;
    assert(condition, message);
  }
  function devWarn(message, extra) {
    if (!__DEV__) return;
    if (extra !== void 0) console.warn(message, extra);
    else console.warn(message);
  }
  function elementTag(element) {
    return element?.tagName?.toLowerCase?.() ?? "";
  }
  function isPathSafe(path) {
    if (typeof path !== "string") return false;
    return /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(path);
  }
  function unwrap(v) {
    if (typeof v === "function" && v[STING_SIGNAL]) return v();
    return v;
  }

  // sting/core/reactivity.js
  var STING_SIGNAL = /* @__PURE__ */ Symbol.for("sting.signal");
  var Listener = null;
  var BatchQueue = null;
  function batch(fn) {
    const prev = BatchQueue;
    const queue = /* @__PURE__ */ new Set();
    BatchQueue = queue;
    try {
      return fn();
    } finally {
      BatchQueue = prev;
      if (!prev) {
        for (const runner of queue) runner();
      } else {
        for (const runner of queue) prev.add(runner);
      }
    }
  }
  function signal(initial) {
    let value = initial;
    const observers = /* @__PURE__ */ new Set();
    function read() {
      if (Listener) {
        observers.add(Listener);
        Listener.deps.add(observers);
      }
      return value;
    }
    read[STING_SIGNAL] = true;
    function write(next) {
      devAssert(observers instanceof Set, "[sting] signal observers must be a Set");
      const nextValue = typeof next === "function" ? next(value) : next;
      if (Object.is(nextValue, value)) return value;
      value = nextValue;
      if (BatchQueue) {
        for (const fn of observers) BatchQueue.add(fn);
      } else {
        const toRun = Array.from(observers);
        for (const fn of toRun) fn();
      }
      return value;
    }
    read._debugObservers = observers;
    return [read, write];
  }
  function effect(fn) {
    let disposed = false;
    let cleanup = null;
    const runner = (
      /** @type {any} */
      (function run() {
        if (disposed) return;
        if (cleanup) {
          try {
            cleanup();
          } catch (e) {
            console.error("[sting] effect cleanup error:", e);
          }
        }
        for (const depObservers of runner.deps) {
          depObservers.delete(runner);
        }
        runner.deps.clear();
        const prev = Listener;
        Listener = runner;
        try {
          const ret = fn();
          if (typeof ret === "function") cleanup = ret;
        } finally {
          Listener = prev;
        }
      })
    );
    runner.deps = /* @__PURE__ */ new Set();
    runner();
    return function dispose() {
      if (disposed) return;
      disposed = true;
      if (cleanup) {
        try {
          cleanup();
        } catch (e) {
          console.error("[sting] effect cleanup error:", e);
        }
      }
      for (const depObservers of runner.deps) {
        depObservers.delete(runner);
      }
      runner.deps.clear();
    };
  }
  function computed(fn) {
    const [get, set] = signal(void 0);
    const dispose = effect(() => {
      set(fn());
    });
    get.dispose = dispose;
    return get;
  }
  function untrack(fn) {
    const prev = Listener;
    Listener = null;
    try {
      return fn();
    } finally {
      Listener = prev;
    }
  }

  // sting/core/store.js
  function produce(mutator) {
    return (prev) => {
      const draft = typeof structuredClone === "function" ? structuredClone(prev) : JSON.parse(JSON.stringify(prev));
      mutator(draft);
      return draft;
    };
  }
  function store(initial) {
    const [get, set] = signal(initial);
    const proxyCache = /* @__PURE__ */ new WeakMap();
    function getAtPath(obj, path) {
      let cur = obj;
      for (const key of path) cur = cur?.[key];
      return cur;
    }
    function setAtPath(draft, path, value) {
      if (path.length === 0) return;
      let cur = draft;
      for (let i = 0; i < path.length - 1; i++) {
        const k = path[i];
        const next = cur?.[k];
        if (next == null || typeof next !== "object") {
          const nk = path[i + 1];
          cur[k] = typeof nk === "number" ? [] : {};
        }
        cur = cur[k];
      }
      cur[path[path.length - 1]] = value;
    }
    function delAtPath(draft, path) {
      if (path.length === 0) return;
      let cur = draft;
      for (let i = 0; i < path.length - 1; i++) {
        cur = cur?.[path[i]];
        if (cur == null) return;
      }
      delete cur[path[path.length - 1]];
    }
    function makeProxy(path) {
      const raw = get();
      if (raw == null || typeof raw !== "object") {
        return raw;
      }
      let perRoot = proxyCache.get(raw);
      if (!perRoot) {
        perRoot = /* @__PURE__ */ new Map();
        proxyCache.set(raw, perRoot);
      }
      const key = path.join(".");
      if (perRoot.has(key)) return perRoot.get(key);
      const p = new Proxy(
        {},
        {
          get(_t, prop) {
            if (prop === Symbol.toStringTag) return "StingStore";
            if (prop === "__raw") return get();
            if (prop === "__path") return path.slice();
            const cur = getAtPath(get(), path);
            if (typeof prop === "symbol") return cur?.[prop];
            const value = cur?.[prop];
            if (value && typeof value === "object") {
              return makeProxy(path.concat(prop));
            }
            return value;
          },
          set(_t, prop, value) {
            if (typeof prop === "symbol") return false;
            set(
              produce((draft) => {
                setAtPath(draft, path.concat(prop), value);
              })
            );
            return true;
          },
          deleteProperty(_t, prop) {
            if (typeof prop === "symbol") return false;
            set(
              produce((draft) => {
                delAtPath(draft, path.concat(prop));
              })
            );
            return true;
          },
          ownKeys() {
            const cur = getAtPath(get(), path);
            return Reflect.ownKeys(cur ?? {});
          },
          getOwnPropertyDescriptor(_t, prop) {
            const cur = getAtPath(get(), path);
            if (cur && prop in cur) return { enumerable: true, configurable: true };
          }
        }
      );
      perRoot.set(key, p);
      return p;
    }
    function setStore(next) {
      set(next);
    }
    return [makeProxy([]), setStore];
  }

  // sting/core/registry.js
  var registry = /* @__PURE__ */ new Map();
  function data(name, factory) {
    registry.set(name, factory);
  }
  function getFactory(name) {
    return registry.get(name);
  }

  // sting/core/directives.js
  var binders = [];
  var binderSet = /* @__PURE__ */ new Set();
  function directive(binder) {
    if (!binderSet.has(binder)) {
      binderSet.add(binder);
      binders.push(binder);
    }
    return () => {
      if (!binderSet.delete(binder)) return;
      const i = binders.indexOf(binder);
      if (i >= 0) binders.splice(i, 1);
    };
  }
  function use(plugin) {
    plugin({ directive });
  }

  // sting/core/lifecycle.js
  var CURRENT_DISPOSERS = null;
  function _withDisposers(disposers, fn) {
    const prev = CURRENT_DISPOSERS;
    CURRENT_DISPOSERS = disposers;
    try {
      return fn();
    } finally {
      CURRENT_DISPOSERS = prev;
    }
  }
  function onCleanup(fn) {
    devAssert(typeof fn === "function", "[sting] onCleanup(fn) requires a function");
    devAssert(!!CURRENT_DISPOSERS, "[sting] onCleanup() called outside component setup");
    CURRENT_DISPOSERS.push(fn);
  }
  function setIntervalSafe(ms, fn) {
    const id = setInterval(fn, ms);
    if (CURRENT_DISPOSERS) CURRENT_DISPOSERS.push(() => clearInterval(id));
    return id;
  }
  function setTimeoutSafe(ms, fn) {
    const id = setTimeout(fn, ms);
    if (CURRENT_DISPOSERS) CURRENT_DISPOSERS.push(() => clearTimeout(id));
    return id;
  }

  // sting/core/runtime.js
  function getAttr(el, name) {
    return el.getAttribute(name);
  }
  function walk(root, fn) {
    const stack = [root];
    while (stack.length) {
      const node = stack.pop();
      if (!node) continue;
      const shouldDescend = fn(node);
      if (shouldDescend === false) continue;
      for (let i = node.children.length - 1; i >= 0; i--) stack.push(node.children[i]);
    }
  }
  function getPath(scope, path) {
    const parts = path.split(".").map((s) => s.trim()).filter(Boolean);
    let cur = scope;
    for (const p of parts) cur = cur?.[p];
    return cur;
  }
  function setPath(scope, path, value) {
    const parts = path.split(".").map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    let cur = scope;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      cur = cur?.[key];
      if (cur == null) {
        console.warn(`setPath: "${path}" not reachable (missing "${key}")`);
        return;
      }
    }
    cur[parts[parts.length - 1]] = value;
  }
  function applyDirectives(rootEl, scope, disposers) {
    const hydrate = (subtreeRootEl, subtreeScope, subtreeDisposers) => {
      applyDirectives(subtreeRootEl, subtreeScope, subtreeDisposers);
    };
    walk(rootEl, (el) => {
      if (el !== rootEl && el.hasAttribute?.("x-data")) return false;
      const ctx = {
        el,
        scope,
        getAttr,
        getPath,
        setPath,
        effect,
        untrack,
        disposers,
        hydrate
      };
      for (const bind of binders) bind(ctx);
    });
  }
  var MOUNTED = /* @__PURE__ */ new WeakMap();
  function mountComponent(rootEl) {
    devAssert(rootEl instanceof Element, "[sting] mountComponent expects an Element");
    const existing = MOUNTED.get(rootEl);
    if (existing) return existing;
    const name = getAttr(rootEl, "x-data");
    devAssert(!!name, `[sting] mountComponent called without x-data`);
    const factory = getFactory(name);
    if (!factory) {
      devWarn(
        `[sting] component "${name}" not registered yet. Did you call sting.data("${name}", ...) before DOM ready?`,
        rootEl
      );
      return;
    }
    const disposers = [];
    const scope = _withDisposers(disposers, () => factory());
    rootEl.__stingScope = scope;
    applyDirectives(rootEl, scope, disposers);
    const destroy = () => {
      MOUNTED.delete(rootEl);
      delete rootEl.__stingScope;
      for (let i = disposers.length - 1; i >= 0; i--) {
        try {
          disposers[i]();
        } catch (e) {
          console.error("[sting] error during disposer", e);
        }
      }
    };
    MOUNTED.set(rootEl, destroy);
    return destroy;
  }
  function unmountComponent(rootEl) {
    devAssert(rootEl instanceof Element, "[sting] unmountComponent expects an Element");
    const destroy = MOUNTED.get(rootEl);
    if (!destroy) return false;
    destroy();
    return true;
  }
  function startSubtree(rootEl) {
    devAssert(rootEl instanceof Element, "[sting] startSubtree(rootEl) expects Element");
    if (rootEl.matches?.("[x-data]")) mountComponent(rootEl);
    rootEl.querySelectorAll?.("[x-data]").forEach((el) => mountComponent(el));
  }
  function start(root = document) {
    devAssert(root === document || root instanceof Element, "[sting] start(root) expects Document or Element");
    const base = root === document ? document.body : root;
    if (!base) return () => {
    };
    startSubtree(base);
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.removedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches?.("[x-data]")) unmountComponent(node);
          node.querySelectorAll?.("[x-data]").forEach((el) => unmountComponent(el));
        }
        for (const node of m.addedNodes) {
          if (!(node instanceof Element)) continue;
          startSubtree(node);
        }
      }
    });
    mo.observe(base, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      if (base.matches?.("[x-data]")) unmountComponent(base);
      base.querySelectorAll?.("[x-data]").forEach((el) => unmountComponent(el));
    };
  }

  // sting/entry/shared.js
  function makeSting() {
    let stop = null;
    let startQueued = false;
    let domReadyHooked = false;
    function startNow(root = document) {
      if (stop) return stop;
      stop = start(root);
      return stop;
    }
    function ensureStarted() {
      if (stop || startQueued) return;
      startQueued = true;
      queueMicrotask(() => {
        startQueued = false;
        if (stop) return;
        if (document.readyState === "loading") {
          autoStart();
          return;
        }
        start2();
      });
    }
    function autoStart() {
      if (stop || startQueued) return;
      if (document.readyState === "loading") {
        if (domReadyHooked) return;
        domReadyHooked = true;
        document.addEventListener(
          "DOMContentLoaded",
          () => {
            if (!stop) startNow(document);
          },
          { once: true }
        );
        return;
      }
      startNow(document);
    }
    function start2(root = document) {
      devAssert(root === document || root instanceof Element, `[sting] start(root) expects Document or Element`);
      if (stop) return stop;
      if (root !== document) return startNow(root);
      if (document.readyState === "loading") {
        autoStart();
        return () => {
          if (!stop) return;
          stop();
          stop = null;
        };
      }
      return startNow(document);
    }
    function data2(name, factory) {
      devAssert(typeof name === "string" && name.length > 0, `[sting] data(name) requires a string name`);
      devAssert(typeof factory === "function", `[sting] data("${name}") requires a factory function`);
      data(name, factory);
      if (stop) {
        const selector = `[x-data="${cssEscape(name)}"]`;
        document.querySelectorAll(selector).forEach((el) => {
          if (!el.__stingScope) mountComponent(el);
        });
        return;
      }
      ensureStarted();
    }
    return {
      ...core_exports,
      data: data2,
      autoStart,
      start: start2,
      // optional: allow stopping in dev/tests
      stop() {
        if (!stop) return;
        stop();
        stop = null;
      }
    };
  }
  function cssEscape(s) {
    if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(s);
    return String(s).replace(/["\\]/g, "\\$&");
  }

  // sting/directives/x-text.js
  function bindXText(ctx) {
    const { el, scope, getAttr: getAttr2, getPath: getPath2, effect: effect2, disposers } = ctx;
    const expr = getAttr2(el, "x-text");
    if (!expr) return;
    devAssert(isPathSafe(expr), `[sting] x-text invalid path "${expr}"`);
    const dispose = effect2(() => {
      const raw = getPath2(scope, expr);
      let v = unwrap(raw);
      if (typeof v === "function") {
        try {
          v = v.length > 0 ? v(scope) : v();
        } catch (e) {
          devWarn(`[sting] x-text "${expr}" threw while evaluating`, e);
          v = "";
        }
      }
      el.textContent = v == null ? "" : String(v);
    });
    disposers.push(dispose);
  }
  directive(bindXText);

  // sting/directives/x-show.js
  function bindXShow(ctx) {
    const { el, scope, getAttr: getAttr2, getPath: getPath2, effect: effect2, disposers } = ctx;
    const expr = getAttr2(el, "x-show");
    if (!expr) return;
    devAssert(isPathSafe(expr), `[sting] x-show invalid path "${expr}"`);
    const initialDisplay = el.style.display;
    const dispose = effect2(() => {
      const value = unwrap(getPath2(scope, expr));
      el.style.display = value ? initialDisplay : "none";
    });
    disposers.push(dispose);
  }
  directive(bindXShow);

  // sting/directives/x-on.js
  function bindXOn(ctx) {
    const { el, scope, getPath: getPath2, disposers } = ctx;
    for (const attr of el.attributes) {
      if (!attr.name.startsWith("x-on:")) continue;
      const eventName = attr.name.slice("x-on:".length).trim();
      const expr = (attr.value ?? "").trim();
      if (!eventName) {
        devWarn(`[sting] x-on missing event name`, el);
        continue;
      }
      if (!expr) {
        devWarn(`[sting] x-on:${eventName} missing expression`, el);
        continue;
      }
      const parsed = parseOnExpr(expr);
      devAssert(!!parsed, `[sting] x-on:${eventName} invalid expression "${expr}"`);
      const handler = (ev) => {
        const { fnPath, args } = parsed;
        devAssert(isPathSafe(fnPath), `[sting] x-on:${eventName} invalid fn path "${fnPath}"`);
        const scopeNow = scope;
        const maybeFn = getPath2(scopeNow, fnPath);
        devAssert(typeof maybeFn === "function", `[sting] x-on:${eventName} "${fnPath}" is not a function`);
        let ret;
        if (args == null) {
          ret = maybeFn(ev);
        } else {
          const argValues = args.map((arg) => resolveArg(scopeNow, getPath2, arg, ev));
          ret = maybeFn(...argValues, ev);
        }
        if (typeof ret === "function") ret(ev);
      };
      el.addEventListener(eventName, handler);
      disposers.push(() => el.removeEventListener(eventName, handler));
    }
  }
  directive(bindXOn);
  function parseOnExpr(expr) {
    const s = expr.trim();
    const m = s.match(/^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\((.*)\)\s*$/);
    if (m) {
      const fnPath = m[1];
      const rawArgs = m[2].trim();
      if (!rawArgs) return { fnPath, args: [] };
      const args = splitArgs(rawArgs);
      if (!args) return null;
      if (args.some((a) => a.length === 0)) return null;
      return { fnPath, args };
    }
    if (isPathSafe(s)) return { fnPath: s, args: null };
    return null;
  }
  function resolveArg(scope, getPath2, argExpr, ev) {
    const s = String(argExpr).trim();
    if (s === "$event") return ev;
    if (s.startsWith('"') && s.endsWith('"') || s.startsWith("'") && s.endsWith("'")) {
      return s.slice(1, -1);
    }
    if (/^-?\d+(?:\.\d+)?$/.test(s)) return Number(s);
    if (s === "true") return true;
    if (s === "false") return false;
    if (s === "null") return null;
    if (s === "undefined") return void 0;
    devAssert(isPathSafe(s), `[sting] x-on arg must be a safe path or literal, got "${s}"`);
    const v = getPath2(scope, s);
    return unwrap(v);
  }
  function splitArgs(source) {
    const out = [];
    let cur = "";
    let quote = null;
    let depth = 0;
    for (let i = 0; i < source.length; i++) {
      const ch = source[i];
      const prev = i > 0 ? source[i - 1] : "";
      if (quote) {
        cur += ch;
        if (ch === quote && prev !== "\\") quote = null;
        continue;
      }
      if (ch === "'" || ch === '"') {
        quote = ch;
        cur += ch;
        continue;
      }
      if (ch === "(") {
        depth++;
        cur += ch;
        continue;
      }
      if (ch === ")") {
        if (depth === 0) return null;
        depth--;
        cur += ch;
        continue;
      }
      if (ch === "," && depth === 0) {
        out.push(cur.trim());
        cur = "";
        continue;
      }
      cur += ch;
    }
    if (quote || depth !== 0) return null;
    out.push(cur.trim());
    return out;
  }

  // sting/directives/x-debug.js
  function bindXDebug(ctx) {
    const { el, scope, getAttr: getAttr2, getPath: getPath2, effect: effect2, untrack: untrack2, disposers } = ctx;
    const expr = getAttr2(el, "x-debug");
    if (!expr) return;
    devAssert(isPathSafe(expr), `[sting] x-debug invalid path "${expr}"`);
    let sig = getPath2(scope, expr);
    if (typeof sig !== "function") {
      sig = getPath2(scope, `$${expr}`);
    }
    const dispose = effect2(() => {
      if (typeof sig !== "function") {
        el.textContent = `debug(${expr}): not a signal getter`;
        return;
      }
      sig();
      const value = untrack2(() => sig());
      const observers = sig._debugObservers?.size ?? "?";
      el.textContent = `debug(${expr}): value=${String(value)} observers=${observers}`;
    });
    disposers.push(dispose);
  }
  directive(bindXDebug);

  // sting/directives/x-model.js
  function bindXModel(ctx) {
    const { el, scope, getAttr: getAttr2, getPath: getPath2, setPath: setPath2, effect: effect2, disposers } = ctx;
    const expr = getAttr2(el, "x-model");
    if (!expr) return;
    devAssert(isPathSafe(expr), `[sting] x-model invalid path "${expr}"`);
    const tag = elementTag(el);
    const isInput = tag === "input";
    const isTextarea = tag === "textarea";
    const isSelect = tag === "select";
    if (!isInput && !isTextarea && !isSelect) {
      devWarn(`[sting] x-model can only be used on input/textarea/select`, el);
      return;
    }
    devAssert(typeof expr === "string" && expr.length > 0, "[sting] x-model expr must be a non-empty string");
    const field = (
      /** @type {any} */
      el
    );
    const inputType = isInput ? (
      /** @type {HTMLInputElement} */
      field.type
    ) : "";
    const isCheckbox = isInput && inputType === "checkbox";
    const isRadio = isInput && inputType === "radio";
    const onInput = () => {
      if (isCheckbox) {
        setPath2(
          scope,
          expr,
          /** @type {HTMLInputElement} */
          field.checked
        );
        return;
      }
      if (isRadio) {
        const radio = (
          /** @type {HTMLInputElement} */
          field
        );
        if (radio.checked) setPath2(scope, expr, radio.value);
        return;
      }
      setPath2(scope, expr, field.value);
    };
    const eventName = isSelect || isCheckbox || isRadio ? "change" : "input";
    field.addEventListener(eventName, onInput);
    disposers.push(() => field.removeEventListener(eventName, onInput));
    const dispose = effect2(() => {
      const value = getPath2(scope, expr);
      if (isCheckbox) {
        const next2 = !!value;
        if (
          /** @type {HTMLInputElement} */
          field.checked !== next2
        ) {
          field.checked = next2;
        }
        return;
      }
      if (isRadio) {
        const radio = (
          /** @type {HTMLInputElement} */
          field
        );
        const shouldCheck = String(value ?? "") === radio.value;
        if (radio.checked !== shouldCheck) radio.checked = shouldCheck;
        return;
      }
      const next = value ?? "";
      if (field.value !== String(next)) field.value = String(next);
    });
    disposers.push(dispose);
  }
  directive(bindXModel);

  // sting/directives/x-bind.js
  function bindXBind(ctx) {
    const { el, scope, getPath: getPath2, effect: effect2, disposers } = ctx;
    for (const attr of el.attributes) {
      if (!attr.name.startsWith("x-bind:")) continue;
      const arg = attr.name.slice("x-bind:".length).trim();
      const expr = (attr.value ?? "").trim();
      if (!arg) {
        devWarn(`[sting] x-bind missing attribute name`, el);
        continue;
      }
      if (!expr) {
        devWarn(`[sting] x-bind:${arg} is missing an expression`, el);
        continue;
      }
      devAssert(isPathSafe(expr), `[sting] x-bind:${arg} invalid path "${expr}"`);
      const dispose = effect2(() => {
        const resolved = getPath2(scope, expr);
        let value = unwrap(resolved);
        if (typeof value === "function") {
          try {
            value = value.length > 0 ? value(scope) : value();
          } catch (e) {
            devWarn(`[sting] x-bind:${arg} "${expr}" threw while evaluating`, e);
            value = null;
          }
        }
        applyBinding(el, arg, value);
      });
      disposers.push(dispose);
    }
  }
  directive(bindXBind);
  function applyBinding(el, attr, value) {
    const tag = elementTag(el);
    if (attr === "disabled" || attr === "checked" || attr === "selected" || attr === "readonly" || attr === "required") {
      const next = !!value;
      const prop = attr === "readonly" ? "readOnly" : attr;
      if (prop in el) el[prop] = next;
      if (next) el.setAttribute(attr, "");
      else el.removeAttribute(attr);
      return;
    }
    if (attr === "value" && (tag === "input" || tag === "textarea" || tag === "select")) {
      const next = value ?? "";
      if (el.value !== String(next)) el.value = String(next);
      return;
    }
    if (attr === "class") {
      applyClassBinding(el, value);
      return;
    }
    if (attr === "style") {
      if (value && typeof value === "object") {
        const parts = [];
        for (const [k, v] of Object.entries(value)) {
          if (v == null || v === false) continue;
          parts.push(`${k}: ${String(v)};`);
        }
        el.setAttribute("style", parts.join(" "));
      } else {
        el.setAttribute("style", value ?? "");
      }
      return;
    }
    if (value == null || value === false) {
      el.removeAttribute(attr);
    } else {
      el.setAttribute(attr, String(value));
    }
  }
  var CLASS_STATE = /* @__PURE__ */ new WeakMap();
  function initClassState(el) {
    let st = CLASS_STATE.get(el);
    if (st) return st;
    st = {
      base: new Set((el.getAttribute("class") || "").split(/\s+/).filter(Boolean)),
      applied: /* @__PURE__ */ new Set()
    };
    CLASS_STATE.set(el, st);
    return st;
  }
  function normalizeClassValue(value) {
    const out = /* @__PURE__ */ new Set();
    if (!value) return out;
    if (typeof value === "string") {
      value.split(/\s+/).filter(Boolean).forEach((c) => out.add(c));
      return out;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") item.split(/\s+/).filter(Boolean).forEach((c) => out.add(c));
      }
      return out;
    }
    if (typeof value === "object") {
      for (const [cls, on] of Object.entries(value)) {
        if (on) cls.split(/\s+/).filter(Boolean).forEach((c) => out.add(c));
      }
      return out;
    }
    return out;
  }
  function applyClassBinding(el, value) {
    const st = initClassState(el);
    const next = normalizeClassValue(value);
    for (const c of st.applied) {
      el.classList.remove(c);
    }
    for (const c of st.base) {
      el.classList.add(c);
    }
    for (const c of next) {
      el.classList.add(c);
    }
    st.applied = next;
  }

  // sting/directives/x-if.js
  var IF_STATE = /* @__PURE__ */ new WeakMap();
  function bindXIf(ctx) {
    const { el, scope, getAttr: getAttr2, getPath: getPath2, effect: effect2, disposers } = ctx;
    const expr = getAttr2(el, "x-if");
    if (!expr) return;
    devAssert(el.tagName.toLowerCase() === "template", `[sting] x-if can only be used on <template>`);
    devAssert(isPathSafe(expr), `[sting] x-if invalid path "${expr}"`);
    let st = IF_STATE.get(el);
    if (!st) {
      st = {
        mounted: false,
        nodes: (
          /** @type {Node[]} */
          []
        ),
        instanceDisposers: (
          /** @type {Array<() => void>} */
          []
        )
      };
      IF_STATE.set(el, st);
    }
    const dispose = effect2(() => {
      const show = !!unwrap(getPath2(scope, expr));
      if (show && !st.mounted) {
        const frag = document.importNode(el.content, true);
        st.nodes = Array.from(frag.childNodes);
        el.parentNode?.insertBefore(frag, el.nextSibling);
        st.instanceDisposers = [];
        for (const n of st.nodes) {
          if (n instanceof Element) applyDirectives(n, scope, st.instanceDisposers);
          else if (n instanceof DocumentFragment) {
            n.querySelectorAll?.("*").forEach((child) => {
              if (child instanceof Element) applyDirectives(child, scope, st.instanceDisposers);
            });
          }
        }
        st.mounted = true;
        return;
      }
      if (!show && st.mounted) {
        unmountIfInstance(st);
      }
    });
    disposers.push(() => {
      dispose();
      unmountIfInstance(st);
      IF_STATE.delete(el);
    });
  }
  directive(bindXIf);
  function unmountIfInstance(st) {
    if (!st.mounted) return;
    for (let i = st.instanceDisposers.length - 1; i >= 0; i--) {
      try {
        st.instanceDisposers[i]();
      } catch {
      }
    }
    st.instanceDisposers = [];
    for (const n of st.nodes) {
      n.parentNode?.removeChild(n);
    }
    st.nodes = [];
    st.mounted = false;
  }

  // sting/directives/x-for.js
  var FOR_STATE = /* @__PURE__ */ new WeakMap();
  function bindXFor(ctx) {
    const { el, scope, getAttr: getAttr2, getPath: getPath2, effect: effect2, disposers, hydrate } = ctx;
    const expr = getAttr2(el, "x-for");
    if (!expr) return;
    devAssert(el.tagName.toLowerCase() === "template", `[sting] x-for can only be used on <template>`);
    const parsed = parseForExpr(expr);
    if (!parsed) {
      devWarn(
        `[sting] x-for invalid expression "${expr}". Expected: "item in items" or "(item, i) in items"`,
        el
      );
      return;
    }
    const { itemName, indexName, listPath } = parsed;
    devAssert(isPathSafe(listPath), `[sting] x-for list must be a safe path, got "${listPath}"`);
    let st = FOR_STATE.get(el);
    if (!st) {
      st = {
        nodes: (
          /** @type {Node[]} */
          []
        ),
        instanceDisposers: (
          /** @type {Array<Array<() => void>>} */
          []
        ),
        marker: document.createComment("sting:x-for"),
        initialized: false
      };
      FOR_STATE.set(el, st);
    }
    if (!st.initialized) {
      st.initialized = true;
      el.parentNode?.insertBefore(st.marker, el.nextSibling);
    }
    const dispose = effect2(() => {
      const resolved = getPath2(scope, listPath);
      let listVal = unwrap(resolved);
      const items = normalizeIterable(listVal);
      clearForInstances(st);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const childScope = Object.create(scope);
        childScope[itemName] = item;
        if (indexName) childScope[indexName] = i;
        const frag = document.importNode(el.content, true);
        const newNodes = Array.from(frag.childNodes);
        st.marker.parentNode?.insertBefore(frag, st.marker);
        for (const n of newNodes) st.nodes.push(n);
        const localDisposers = [];
        st.instanceDisposers.push(localDisposers);
        for (const n of newNodes) {
          if (n.nodeType === Node.ELEMENT_NODE) {
            hydrate(
              /** @type {Element} */
              n,
              childScope,
              localDisposers
            );
          }
        }
      }
    });
    disposers.push(() => {
      try {
        dispose();
      } finally {
        clearForInstances(st);
        try {
          st.marker.parentNode?.removeChild(st.marker);
        } catch {
        }
        FOR_STATE.delete(el);
      }
    });
  }
  directive(bindXFor);
  function parseForExpr(expr) {
    const m = expr.trim().match(/^\s*(\([^)]+\)|[A-Za-z_$][\w$]*)\s+in\s+(.+?)\s*$/);
    if (!m) return null;
    const lhs = m[1].trim();
    const listPath = m[2].trim();
    let itemName = "";
    let indexName = "";
    if (lhs.startsWith("(")) {
      const inner = lhs.slice(1, -1);
      const parts = inner.split(",").map((s) => s.trim()).filter(Boolean);
      if (parts.length < 1) return null;
      itemName = parts[0];
      indexName = parts[1] || "";
    } else {
      itemName = lhs;
    }
    if (!/^[A-Za-z_$][\w$]*$/.test(itemName)) return null;
    if (indexName && !/^[A-Za-z_$][\w$]*$/.test(indexName)) return null;
    return { itemName, indexName: indexName || null, listPath };
  }
  function normalizeIterable(val) {
    if (Array.isArray(val)) return val;
    if (val == null) return [];
    if (typeof val[Symbol.iterator] === "function") return Array.from(val);
    return [];
  }
  function clearForInstances(st) {
    for (const ds of st.instanceDisposers) {
      for (let i = ds.length - 1; i >= 0; i--) {
        try {
          ds[i]();
        } catch {
        }
      }
    }
    st.instanceDisposers.length = 0;
    for (const n of st.nodes) {
      try {
        n.parentNode?.removeChild(n);
      } catch {
      }
    }
    st.nodes.length = 0;
  }

  // sting/directives/x-effect.js
  function bindXEffect(ctx) {
    const { el, scope, getAttr: getAttr2, getPath: getPath2, effect: effect2, disposers } = ctx;
    const expr = getAttr2(el, "x-effect");
    if (!expr) return;
    devAssert(isPathSafe(expr), `[sting] x-effect invalid path "${expr}"`);
    const dispose = effect2(() => {
      const fn = getPath2(scope, expr);
      if (typeof fn !== "function") {
        devWarn(`[sting] x-effect "${expr}" is not a function`, el);
        return;
      }
      try {
        return fn.length > 0 ? fn(el, scope) : fn();
      } catch (e) {
        devWarn(`[sting] x-effect "${expr}" threw`, e);
      }
    });
    disposers.push(dispose);
  }
  directive(bindXEffect);

  // sting/entry/entry-global.js
  var stingInstance = makeSting();
  var entry_global_default = stingInstance;
  return __toCommonJS(entry_global_exports);
})();
window.sting = sting.default || sting;
//# sourceMappingURL=sting.global.js.map

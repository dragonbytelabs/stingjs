var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// sting/core/index.js
var core_exports = {};
__export(core_exports, {
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
  produce: () => produce,
  signal: () => signal,
  start: () => start,
  store: () => store,
  untrack: () => untrack,
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

// sting/core/reactivity.js
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
  const runner = (
    /** @type {any} */
    (function run() {
      if (disposed) return;
      for (const depObservers of runner.deps) {
        depObservers.delete(runner);
      }
      runner.deps.clear();
      const prev = Listener;
      Listener = runner;
      try {
        fn();
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
  const proxy = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === Symbol.toStringTag) return "StingStore";
        if (prop === "__raw") return get();
        const cur = get();
        return cur?.[prop];
      },
      set(_target, prop, value) {
        set(
          produce((d) => {
            d[prop] = value;
          })
        );
        return true;
      },
      ownKeys() {
        return Reflect.ownKeys(get() ?? {});
      },
      getOwnPropertyDescriptor(_target, prop) {
        const cur = get();
        if (cur && prop in cur) {
          return { enumerable: true, configurable: true };
        }
      }
    }
  );
  function setStore(next) {
    set(next);
  }
  return [proxy, setStore];
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

// sting/core/runtime.js
function getAttr(el, name) {
  return el.getAttribute(name);
}
function walk(root, fn) {
  const stack = [root];
  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;
    fn(node);
    for (let i = node.children.length - 1; i >= 0; i--) {
      stack.push(node.children[i]);
    }
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
  const last = parts[parts.length - 1];
  cur[last] = value;
}
function mountComponent(rootEl) {
  devAssert(rootEl instanceof Element, "[sting] mountComponent expects an Element");
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
  const scope = factory();
  const disposers = [];
  walk(rootEl, (el) => {
    const ctx = {
      el,
      scope,
      getAttr,
      getPath,
      setPath,
      effect,
      untrack,
      disposers
    };
    for (const bind of binders) {
      bind(ctx);
    }
  });
  return () => {
    for (let i = disposers.length - 1; i >= 0; i--) {
      try {
        disposers[i]();
      } catch (e) {
        console.error("[sting] error during disposer", e);
      }
    }
  };
}
function start(root = document) {
  devAssert(root === document || root instanceof Element, "[sting] start(root) expects Document or Element");
  const roots = root.querySelectorAll("[x-data]");
  const destroys = /* @__PURE__ */ new Map();
  for (const el of roots) {
    const destroy = mountComponent(el);
    if (destroy) destroys.set(el, destroy);
  }
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.removedNodes) {
        if (!(node instanceof Element)) continue;
        if (destroys.has(node)) {
          destroys.get(node)();
          destroys.delete(node);
        }
        node.querySelectorAll?.("[x-data]").forEach((el) => {
          if (destroys.has(el)) {
            destroys.get(el)();
            destroys.delete(el);
          }
        });
      }
    }
  });
  mo.observe(root === document ? document.body : root, { childList: true, subtree: true });
  return () => {
    mo.disconnect();
    for (const destroy of destroys.values()) destroy();
    destroys.clear();
  };
}

// sting/entry/shared.js
function makeSting() {
  let started = false;
  let startQueued = false;
  function ensureStarted() {
    if (started || startQueued) return;
    startQueued = true;
    queueMicrotask(() => {
      startQueued = false;
      if (started) return;
      started = true;
      start();
    });
  }
  let domReadyHooked = false;
  function autoStart2() {
    if (started || startQueued) return;
    if (document.readyState === "loading") {
      if (domReadyHooked) return;
      domReadyHooked = true;
      document.addEventListener("DOMContentLoaded", ensureStarted, { once: true });
    } else {
      ensureStarted();
    }
  }
  function data3(name, factory) {
    devAssert(typeof name === "string" && name.length > 0, `[sting] data(name) requires a string name`);
    devAssert(typeof factory === "function", `[sting] data("${name}") requires a factory function`);
    data(name, factory);
    ensureStarted();
  }
  return {
    ...core_exports,
    data: data3,
    autoStart: autoStart2,
    start: ensureStarted
  };
}

// sting/directives/x-text.js
function bindXText(ctx) {
  const { el, scope, getAttr: getAttr2, getPath: getPath2, effect: effect3, disposers } = ctx;
  const expr = getAttr2(el, "x-text");
  if (!expr) return;
  devAssert(isPathSafe(expr), `[sting] x-text invalid path "${expr}"`);
  const dispose = effect3(() => {
    const resolved = getPath2(scope, expr);
    const value = typeof resolved === "function" ? resolved() : resolved;
    el.textContent = value ?? "";
  });
  disposers.push(dispose);
}
directive(bindXText);

// sting/directives/x-show.js
function bindXShow(ctx) {
  const { el, scope, getAttr: getAttr2, getPath: getPath2, effect: effect3, disposers } = ctx;
  const expr = getAttr2(el, "x-show");
  if (!expr) return;
  devAssert(isPathSafe(expr), `[sting] x-show invalid path "${expr}"`);
  const initialDisplay = el.style.display;
  const dispose = effect3(() => {
    const resolved = getPath2(scope, expr);
    const value = typeof resolved === "function" ? resolved() : resolved;
    el.style.display = value ? initialDisplay : "none";
  });
  disposers.push(dispose);
}
directive(bindXShow);

// sting/directives/x-on.js
function bindXOn(ctx) {
  const { el, scope, getPath: getPath2, disposers } = ctx;
  const bound = getOrInitBoundMap(el);
  for (const attr of el.attributes) {
    if (!attr.name.startsWith("x-on:")) continue;
    const eventName = attr.name.slice(5).trim();
    const expr = (attr.value ?? "").trim();
    if (!eventName) {
      devWarn(`[sting] invalid ${attr.name} (missing event name)`, el);
      continue;
    }
    if (!expr) {
      devWarn(`[sting] ${attr.name} is missing a handler name`, el);
      continue;
    }
    devAssert(isPathSafe(expr), `[sting] ${attr.name} invalid handler path "${expr}"`);
    const key = `${eventName}::${expr}`;
    if (bound.has(key)) continue;
    const handlerFn = getPath2(scope, expr);
    if (typeof handlerFn !== "function") {
      devWarn(`[sting] ${attr.name}="${expr}" is not a function`, el);
      continue;
    }
    const handler = (e) => handlerFn(e);
    el.addEventListener(eventName, handler);
    disposers.push(() => el.removeEventListener(eventName, handler));
    bound.set(key, handler);
  }
}
directive(bindXOn);
var _boundListeners = /* @__PURE__ */ new WeakMap();
function getOrInitBoundMap(el) {
  let m = _boundListeners.get(el);
  if (!m) {
    m = /* @__PURE__ */ new Map();
    _boundListeners.set(el, m);
  }
  return m;
}

// sting/directives/x-debug.js
function bindXDebug(ctx) {
  const { el, scope, getAttr: getAttr2, getPath: getPath2, effect: effect3, untrack: untrack3, disposers } = ctx;
  const expr = getAttr2(el, "x-debug");
  if (!expr) return;
  devAssert(isPathSafe(expr), `[sting] x-debug invalid path "${expr}"`);
  let sig = getPath2(scope, expr);
  if (typeof sig !== "function") {
    sig = getPath2(scope, `$${expr}`);
  }
  const dispose = effect3(() => {
    if (typeof sig !== "function") {
      el.textContent = `debug(${expr}): not a signal getter`;
      return;
    }
    sig();
    const value = untrack3(() => sig());
    const observers = sig._debugObservers?.size ?? "?";
    el.textContent = `debug(${expr}): value=${String(value)} observers=${observers}`;
  });
  disposers.push(dispose);
}
directive(bindXDebug);

// sting/directives/x-model.js
function bindXModel(ctx) {
  const { el, scope, getAttr: getAttr2, getPath: getPath2, setPath: setPath2, effect: effect3, disposers } = ctx;
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
  const dispose = effect3(() => {
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

// sting/entry/entry-esm.js
var sting = makeSting();
sting.autoStart();
var entry_esm_default = sting;
var {
  data: data2,
  start: start2,
  autoStart,
  signal: signal2,
  effect: effect2,
  batch: batch2,
  untrack: untrack2,
  computed: computed2,
  store: store2,
  produce: produce2,
  directive: directive2,
  use: use2,
  binders: binders2
} = sting;
export {
  autoStart,
  batch2 as batch,
  binders2 as binders,
  computed2 as computed,
  data2 as data,
  entry_esm_default as default,
  directive2 as directive,
  effect2 as effect,
  produce2 as produce,
  signal2 as signal,
  start2 as start,
  store2 as store,
  untrack2 as untrack,
  use2 as use
};
//# sourceMappingURL=sting.mjs.map

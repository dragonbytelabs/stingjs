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
    batch: () => batch,
    binders: () => binders,
    data: () => data,
    directive: () => directive,
    effect: () => effect,
    produce: () => produce,
    signal: () => signal,
    start: () => start,
    store: () => store,
    untrack: () => untrack,
    use: () => use
  });

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
  function resolvePath(scope, path) {
    const parts = path.split(".").map((s) => s.trim()).filter(Boolean);
    let cur = scope;
    for (const p of parts) cur = cur?.[p];
    return cur;
  }
  function mountComponent(rootEl) {
    const name = getAttr(rootEl, "x-data");
    if (!name) return;
    const factory = getFactory(name);
    if (!factory) {
      console.warn(`[sting] unknown component "${name}"`, rootEl);
      return;
    }
    const scope = factory();
    const disposers = [];
    walk(rootEl, (el) => {
      const ctx = {
        el,
        scope,
        getAttr,
        resolvePath,
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
    function ensureStarted() {
      if (started) return;
      started = true;
      start();
    }
    function autoStart() {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", ensureStarted, { once: true });
      } else {
        ensureStarted();
      }
    }
    function data2(name, factory) {
      data(name, factory);
      ensureStarted();
    }
    return {
      ...core_exports,
      data: data2,
      autoStart,
      start: ensureStarted
    };
  }

  // sting/directives/x-text.js
  function bindXText(ctx) {
    const { el, scope, getAttr: getAttr2, resolvePath: resolvePath2, effect: effect2, disposers } = ctx;
    const expr = getAttr2(el, "x-text");
    if (!expr) return;
    const dispose = effect2(() => {
      const value = resolvePath2(scope, expr);
      el.textContent = value ?? "";
    });
    disposers.push(dispose);
  }
  directive(bindXText);

  // sting/directives/x-show.js
  function bindXShow(ctx) {
    const { el, scope, getAttr: getAttr2, resolvePath: resolvePath2, effect: effect2, disposers } = ctx;
    const expr = getAttr2(el, "x-show");
    if (!expr) return;
    const initialDisplay = el.style.display;
    const dispose = effect2(() => {
      const value = resolvePath2(scope, expr);
      el.style.display = value ? initialDisplay : "none";
    });
    disposers.push(dispose);
  }
  directive(bindXShow);

  // sting/directives/x-on.js
  function bindXOn(ctx) {
    const { el, scope, resolvePath: resolvePath2, disposers } = ctx;
    for (const attr of el.attributes) {
      if (!attr.name.startsWith("x-on:")) continue;
      const eventName = attr.name.slice(5);
      const handlerFn = resolvePath2(scope, attr.value);
      if (typeof handlerFn !== "function") {
        console.warn(`[sting] ${attr.name}="${attr.value}" is not a function`, el);
        continue;
      }
      const handler = (e) => handlerFn(e);
      el.addEventListener(eventName, handler);
      disposers.push(() => el.removeEventListener(eventName, handler));
    }
  }
  directive(bindXOn);

  // sting/directives/x-debug.js
  function bindXDebug(ctx) {
    const { el, scope, getAttr: getAttr2, resolvePath: resolvePath2, effect: effect2, untrack: untrack2, disposers } = ctx;
    const expr = getAttr2(el, "x-debug");
    if (!expr) return;
    let sig = resolvePath2(scope, expr);
    if (typeof sig !== "function") {
      sig = resolvePath2(scope, `$${expr}`);
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

  // sting/entry/entry-global.js
  var stingInstance = makeSting();
  stingInstance.autoStart();
  var entry_global_default = stingInstance;
  return __toCommonJS(entry_global_exports);
})();
window.sting = sting.default || sting;
//# sourceMappingURL=sting.global.js.map

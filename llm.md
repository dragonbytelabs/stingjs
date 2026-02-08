# StingJS LLM Reference (Repository Capability Map)

This file is a complete, implementation-grounded summary of what this repository provides.
Use it as context for another LLM that needs to understand and work with StingJS.

## 1) Repository Packages

### `sting-js` (library)
- Package name: `stingjs`
- Version: `1.0.0`
- ESM build: `dist/sting.mjs`
- Global build: `dist/sting.global.js` (attaches `window.sting`)
- Source entry: `sting/entry/entry-esm.js` and `sting/entry/entry-global.js`

### `create-sting-app` (scaffolder engine)
- Package name: `create-sting-app`
- CLI bin: `create-sting-app`
- Node requirement: `>=18`
- Purpose: scaffold a starter StingJS app in JavaScript or TypeScript
- Main implementation: `create-sting-app/lib/run.js`

### `create-sting` (npm create entry package)
- Package name: `create-sting`
- CLI bin: `create-sting`
- Node requirement: `>=18`
- Purpose: powers `npm create sting@latest`
- Delegates to `create-sting-app/cli`

## 2) Library Export Surface (`stingjs`)

From `sting/entry/entry-esm.js`, StingJS exports:

### Default export
- `default sting`
- Includes all core functions plus runtime-managed `data`, `start`, `autoStart`, and `stop` (as a method on the default object)

### Named exports
- `data(name, factory)`
- `start(root?)`
- `unmountComponent(rootEl)`
- `autoStart()`
- `signal(initial)`
- `effect(fn)`
- `batch(fn)`
- `untrack(fn)`
- `computed(fn)`
- `store(initial)`
- `produce(mutator)`
- `directive(binder)`
- `use(plugin)`
- `binders` (internal binder list)

Notes:
- Named export `stop` is not exported in `entry-esm.js`.
- `stop()` exists on the default exported `sting` object from `makeSting()`.

## 3) Runtime Model

### Component registration
- `data(name, factory)` stores factories in a registry map.
- DOM uses `x-data="name"` to select the factory.

### Mounting
- `start(root)` mounts all `[x-data]` roots under `root`.
- A `MutationObserver` mounts added `[x-data]` roots and unmounts removed ones.
- `mountComponent(rootEl)`:
  - Creates scope via factory.
  - Applies directives recursively.
  - Stores scope on `rootEl.__stingScope`.
  - Registers and executes disposers on teardown.

### Nested component boundaries
- Directive walk stops descending into nested `x-data` roots.
- Nested roots own their own scope/disposers.

### Auto-start behavior
- ESM entry calls `sting.autoStart()`.
- If DOM is loading, start is deferred to `DOMContentLoaded`.
- Calling `data()` when runtime is idle queues a start attempt.
- Calling `data()` after runtime started mounts existing matching unmounted roots.

## 4) Reactivity Primitives

### `signal(initial)`
- Returns `[read, write]`.
- `read()` tracks dependencies during active effects.
- `write(nextOrUpdater)` updates value and triggers observers.
- Uses `Object.is` equality guard.
- Signal getter is marked with internal `STING_SIGNAL` symbol for safe unwrap behavior.

### `effect(fn)`
- Runs immediately.
- Tracks signal dependencies.
- Re-runs when dependencies update.
- Supports cleanup by returning a function from `fn`.
- Returns disposer.

### `computed(fn)`
- Internally creates a signal and an effect.
- Returns getter function.
- Getter has `.dispose` property for tearing down underlying effect.

### `batch(fn)`
- Batches signal updates and flushes observers once per batch boundary.

### `untrack(fn)`
- Executes `fn` with dependency tracking disabled.

## 5) State Helpers

### `store(initial)`
- Returns `[proxy, setStore]`.
- Proxy supports deep nested property get/set/delete.
- Any write is applied immutably via `produce(...)` and updates root signal.
- Designed for ergonomic nested mutation while remaining reactive.

### `produce(mutator)`
- Returns updater function `(prev) => next`.
- Uses `structuredClone` if available, otherwise JSON clone fallback.

## 6) Lifecycle Helpers

### `onCleanup(fn)`
- Registers a cleanup function during component setup only.
- Throws in dev mode if called outside setup.

### `setIntervalSafe(ms, fn)` / `setTimeoutSafe(ms, fn)`
- Wrap timers and auto-register cleanup when inside component setup.

## 7) Directive System

### Registration
- `directive(binder)` adds directive binder (idempotent by function identity).
- Returns unregister function.

### Plugin system
- `use(plugin)` calls `plugin({ directive })`.
- Plugin extension surface is directive registration.

### Built-in directives (auto-registered in entries)
- `x-text`
- `x-show`
- `x-on:event`
- `x-debug`
- `x-model`
- `x-bind:attr`
- `x-if` (template only)
- `x-for` (template only)
- `x-effect`

## 8) Expression and Safety Rules

Global rule:
- Most directive expressions must be path-safe identifiers/dot-paths.
- Arbitrary JS expression evaluation is not supported.
- No `eval` / `new Function` directive engine.

Path-safe regex logic allows:
- `name`
- `user.profile.name`

Not allowed:
- inline arithmetic (`count + 1`)
- arbitrary JS snippets

## 9) Built-in Directive Behavior (Exact)

### `x-text="path"`
- Reads scope path reactively.
- Unwraps signals.
- If resolved value is a plain function, executes it (`fn()` or `fn(scope)` if arity > 0).
- Sets `textContent` to stringified result, empty string for nullish.

### `x-show="path"`
- Reactively toggles `el.style.display`.
- Truthy: restores initial inline display value.
- Falsy: sets `display: none`.

### `x-on:event="handler"` and call forms
Supported forms:
- `x-on:click="inc"`
- `x-on:click="remove(i)"`
- `x-on:click="setLabel('a', 1, true)"`
- `x-on:click="setFromEvent($event)"`

Behavior:
- Resolves handler path from scope.
- If no args were provided in expression, calls `handler(event)`.
- If args were provided, resolves args then calls `handler(...args, event)`.
- If handler returns a function, returned function is called with `event` (curried pattern).

Argument resolver supports:
- strings (`"..."` or `'...'`)
- numbers
- booleans
- `null`
- `undefined`
- `$event`
- path-safe scope paths (with signal unwrap)

Not supported:
- event modifiers (`.prevent`, `.stop`, etc.)

### `x-model="path"`
- Two-way binding between form controls and scope path.
- Supported elements:
  - `input`
  - `textarea`
  - `select`
- Special handling:
  - checkbox: boolean via `.checked`
  - radio: selected radio writes `.value`
  - others: `.value`
- Events used:
  - `input` for text-like controls
  - `change` for select/checkbox/radio

Important:
- Writes use path assignment (`setPath`), so primitives backed by signals should be exposed via JS getters/setters on the scope object when needed.

### `x-bind:attr="path"`
- Reactively binds attributes/properties.
- Handles:
  - boolean-ish attrs: `disabled`, `checked`, `selected`, `readonly`, `required`
  - input/select/textarea `value`
  - `class` with string/array/object syntax
  - `style` as string or object
  - generic attributes
- For generic attrs, `null`/`false` remove attribute.
- Plain functions are treated as computed getters (`fn()` or `fn(scope)`).

### `x-if="path"` on `<template>`
- Template-only.
- Clones and inserts template content when truthy.
- Removes inserted nodes when falsy.
- Hydrates directives inside inserted nodes.
- Disposes inserted-node directive effects/listeners on unmount.

### `x-for="item in items"` / `x-for="(item, i) in items"` on `<template>`
- Template-only.
- Parses loop expression and resolves iterable from scope path.
- Supports arrays and generic iterables.
- For each item:
  - creates child scope via `Object.create(parentScope)`
  - binds item and optional index
  - clones template and hydrates inserted element nodes
- On updates:
  - clears all prior loop instances
  - full re-render
- No keyed diffing semantics.

### `x-effect="pathToFunction"`
- Reactively executes scope function.
- If function returns cleanup, cleanup is honored via reactivity effect lifecycle.
- Warns if resolved path is not a function.

### `x-debug="signalPathOrName"`
- Development helper.
- Displays debug text in DOM with current signal value and observer count.
- If path is not a function, attempts fallback lookup of `$<expr>`.

## 10) Utility/Dev Behavior

- `devAssert` and `devWarn` guard developer misuse.
- Build defines `__DEV__` as `false` in distributed bundles.
- Internal helper `unwrap(v)` only auto-calls functions marked as signals.

## 11) CSP and Compatibility

### CSP posture
- Designed to avoid runtime code evaluation.
- Includes strict CSP fixture:
  - `static/csp-smoke.html`
  - `static/csp-smoke.js`
- CSP Playwright test validates basic mount/reactivity under strict policy.

### Browser baseline
- Modern evergreen browsers.
- Requires features like ES modules, Proxy, WeakMap, MutationObserver.
- Playwright matrix: Chromium, Firefox, WebKit.

## 12) Demo and Test Components in Repository

### Demo page components (`demo/example.js`)
Registered `x-data` components:
- `profile`
- `counter`
- `formLab`
- `classLab`
- `ifLab`
- `forLab`
- `effectLab`
- `ifLeakLab`

These are demonstration/test harness components, not framework internals.

### Static fixture components
- `cspCounter` in `static/csp-smoke.js`
- `edgeCases` in `static/edge-cases.js`

### Scaffold template component
- `counter` in `create-sting-app` templates (`main.js` / `main.ts`)

## 13) What the Test Suite Verifies

Playwright tests cover:
- profile E2E behavior (`x-text`, `x-show`, `x-model`, `x-bind`)
- strict CSP smoke behavior
- edge cases:
  - nested `x-model` path updates
  - `x-bind` attribute removal on null
  - `x-on` literal args and `$event`
- directive-focused checks:
  - `x-show`
  - `x-on`
  - `x-model`
  - `x-bind:class`
  - `x-if` hydration and teardown
  - `x-for` rendering/removal handlers
  - `x-effect` rerun/cleanup and dynamic mount/unmount via MutationObserver
  - `x-debug` rendering/reactivity

## 14) Build, Test, and CI

### Build
- `npm run build` runs `build.mjs` (esbuild) producing:
  - `dist/sting.mjs`
  - `dist/sting.global.js`

### Size budget
- `npm run size:check`
- Enforces gzipped max 9000 bytes for both dist artifacts.

### Tests
- `npm test` (chromium)
- `npm run test:all` (chromium/firefox/webkit)

### Scaffold smoke
- `npm run create:smoke`
- Validates JS + TS scaffold output from `create-sting` CLI.

### CI jobs (`.github/workflows/ci.yml`)
- `create-scaffold-smoke`
- `build-and-size`
- `test-browser-matrix`

## 15) Scaffolding Capabilities (`npm create sting@latest`)

### Command flow
- User command: `npm create sting@latest`
- Resolves to package `create-sting`
- `create-sting` delegates to `create-sting-app`

### CLI options
- `-t, --template <name>` where name in:
  - `javascript` / `js` / `vanilla` / `vanilla-js`
  - `typescript` / `ts` / `vanilla-ts`
- `-y, --yes` skip prompts
- `-f, --force` allow non-empty target dir
- `-h, --help`

### Prompted mode
- asks for project name (default: `sting-app`)
- asks language: JavaScript or TypeScript

### Generated project
Common:
- `index.html` with counter UI
- `src/style.css` (vanilla CSS)
- counter with Increase/Decrease buttons
- `package.json` with:
  - `stingjs` dependency `^1.0.0`
  - `vite` devDependency `^7.3.1`
  - scripts: `dev`, `build`, `preview`

TypeScript template additionally:
- `src/main.ts`
- `tsconfig.json`
- `src/stingjs.d.ts`
- `typescript` devDependency `^5.9.3`
- `typecheck` script (`tsc --noEmit`)

## 16) Release/Publish Helpers for Create Packages

Root scripts:
- `npm run create:publish:dry-run`
- `npm run create:publish -- --public`

Implementation:
- `scripts/release-create-packages.mjs`
- Publishes in strict order:
  1. `create-sting-app`
  2. `create-sting`
- Optional publish tag support via `--tag <tag>`.

## 17) Non-Goals / Not Implemented

- No arbitrary JS expression engine in directives.
- No event modifier syntax for `x-on`.
- No x-model modifier chain like `.trim` / `.number`.
- No keyed diff algorithm in `x-for` (full re-render behavior).
- No official TypeScript type package for `stingjs` in this repo (TS scaffold includes local minimal declaration file).

## 18) Quick Usage Examples

### ESM
```html
<div x-data="counter">
  <button x-on:click="inc">+1</button>
  <span x-text="count"></span>
</div>
<script type="module">
  import sting from "stingjs"
  sting.data("counter", () => {
    const [count, setCount] = sting.signal(0)
    return { count, inc: () => setCount((n) => n + 1) }
  })
</script>
```

### Global build
```html
<script src="/dist/sting.global.js" defer></script>
<script type="module" defer>
  const sting = window.sting
  sting.data("counter", () => {
    const [count, setCount] = sting.signal(0)
    return { count, inc: () => setCount((n) => n + 1) }
  })
</script>
```

---
If another LLM needs to modify this repo safely, it should treat sections 2 through 17 as the operational contract for current behavior.

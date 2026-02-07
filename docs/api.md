# API Reference

## Entry Points

Package exports:
- ESM: `dist/sting.mjs`
- Global/IIFE: `dist/sting.global.js` (exposes `window.sting`)

## Primary API

### `data(name, factory)`
Registers component factory used by `x-data="name"`.

### `start(root?)`
Starts runtime on a root `Element` or `document`.

### `autoStart()`
Starts automatically at DOM ready.

### `stop()`
Stops runtime and disposes mounted components.

## Reactivity

### `signal(initial)`
Returns `[get, set]` pair.

### `effect(fn)`
Runs reactive computation and returns disposer.

### `computed(fn)`
Returns derived getter; underlying effect disposer available as `getter.dispose`.

### `batch(fn)`
Batches signal writes.

### `untrack(fn)`
Runs without dependency tracking.

## State Helpers

### `store(initial)`
Deep proxy store with root-level reactive invalidation.

### `produce(mutator)`
Returns immutable-style updater function.

## Lifecycle Helpers

### `onCleanup(fn)`
Registers cleanup callback during component setup.

### `setIntervalSafe(ms, fn)`
Interval helper auto-cleaned with component teardown.

### `setTimeoutSafe(ms, fn)`
Timeout helper auto-cleaned with component teardown.

## Extensibility

### `directive(binder)`
Registers custom directive binder.

### `use(plugin)`
Installs plugin receiving `{ directive }`.

### `binders`
Internal binder registry (primarily for tests/devtools).

## Utilities

Exported utility helpers are available via core exports and include:
- `assert`, `devAssert`, `devWarn`
- `isPathSafe`, `unwrap`, `elementTag`

# StingJS

<p>
  <img src="complex-frameworks.png" alt="StingJS glows as frameworks approach" />
</p>

A tiny, CSP-friendly reactive framework with:
- AlpineJS-style DOM directives (`x-*`)
- SolidJS-inspired fine-grained reactivity (`signal`, `effect`, `computed`)
- ESM and global builds

## Install

```bash
npm i stingjs
```

## Quickstart (ESM)

```html
<div x-data="counter">
  <button x-on:click="inc">+1</button>
  <span x-text="count"></span>
</div>

<script type="module">
  import sting from "stingjs"

  sting.data("counter", () => {
    const [count, setCount] = sting.signal(0)
    const inc = () => setCount((n) => n + 1)
    return { count, inc }
  })
</script>
```

## Quickstart (Global Build)

```html
<script src="/dist/sting.global.js" defer></script>
<script type="module" defer>
  const sting = window.sting

  sting.data("counter", () => {
    const [count, setCount] = sting.signal(0)
    return {
      count,
      inc: () => setCount((n) => n + 1),
    }
  })
</script>
```

## Directive Index

- `x-text`: set text from a scope path/signal
- `x-show`: toggle visibility with `display: none`
- `x-on:event`: bind events with safe path/literal args
- `x-model`: two-way binding for input/textarea/select
- `x-bind:attr`: bind attributes/properties (`class`, `style`, booleans)
- `x-if` (`<template>`): conditional DOM insertion/removal
- `x-for` (`<template>`): render lists with item/index scopes
- `x-effect`: run reactive side effects with cleanup support
- `x-debug`: signal debugging aid (dev-oriented)

Full contract: `docs/directives.md`

## API Surface

Core exports include:
- Reactivity: `signal`, `effect`, `computed`, `batch`, `untrack`
- State helpers: `store`, `produce`
- Runtime: `data`, `start`, `autoStart`, `stop`
- Extensibility: `directive`, `use`
- Lifecycle helpers: `onCleanup`, `setIntervalSafe`, `setTimeoutSafe`

Full API: `docs/api.md`

## CSP Compatibility

StingJS is designed to work without `eval`/`new Function`.

- No runtime expression evaluation engine
- Path-safe directive expressions
- Strict-CSP smoke test fixture: `static/csp-smoke.html`

CSP guide: `docs/csp.md`

## Browser Compatibility

See: `docs/compatibility.md`

## Development

```bash
npm ci
npm run build
npm test
```

Additional commands:
- `npm run test:all` (chromium + firefox + webkit)
- `npm run size:check` (bundle size budget)
- `npm run release:check` (build + tests + size budget)

## Release Notes

- Source of truth for v1: `stingjs.md`
- Execution plan: `llm_tasks.md`
- Changelog: `CHANGELOG.md`
- Release policy/checklist: `docs/release-policy.md`

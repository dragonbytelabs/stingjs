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

## Scaffold A New App

```bash
npm create sting@latest
```

With a target directory:

```bash
npm create sting@latest my-sting-app
```

Pick a template non-interactively:

```bash
npm create sting@latest my-sting-app -- --template typescript --yes
```

Template values: `javascript` (`js`) and `typescript` (`ts`).

This command resolves to npm package `create-sting`, which delegates to `create-sting-app`.

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
- `npm run site:dev` (serve marketing/docs site at `http://127.0.0.1:4173`)
- `npm run site:check` (validate site files and key sections)
- `npm run create:smoke` (scaffold smoke checks for JS + TS starter templates)
- `npm run create:publish:dry-run` (dry-run publish in order: `create-sting-app` then `create-sting`)
- `npm run create:publish -- --public` (publish both packages in that order with `--access public`)

## Release Notes

- Source of truth for v1: `stingjs.md`
- Execution plan: `llm_tasks.md`
- Changelog: `CHANGELOG.md`
- Release policy/checklist: `docs/release-policy.md`

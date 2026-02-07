# StingJS v1.0 Source of Truth

Last updated: 2026-02-07
Status: v1 release-ready (current package version is `1.0.0`)

This file is the canonical product and implementation contract for StingJS v1.0.
If this file conflicts with README/demo copy, this file wins.

## 1) Product Positioning

StingJS delivers:
- AlpineJS-style DOM-first authoring (`x-*` directives)
- SolidJS-inspired fine-grained reactivity (`signal`, `effect`, `computed`)
- Small footprint and low conceptual overhead
- CSP-friendly runtime (no `eval`, no `new Function`)

Target users:
- SSR/static HTML teams wanting progressive enhancement
- Developers who want reactivity without SPA framework overhead
- Security-sensitive environments with strict CSP

## 2) Non-Negotiable v1 Principles

1. CSP-first: works with `script-src` policies that omit `unsafe-eval`.
2. Deterministic lifecycle: effects/listeners/timers are disposed on unmount.
3. Predictable directives: behavior is documented and regression tested.
4. Stable public API: semver-ready `1.x` core export contract.
5. Production readiness: CI gates, docs, release policy, compatibility statement.

## 3) Current Implementation Snapshot

### 3.1 Public API (implemented)

From `sting/core/index.js` and entry exports:
- Reactivity: `signal`, `effect`, `batch`, `untrack`, `computed`, `STING_SIGNAL`
- State helpers: `store`, `produce`
- Runtime: `data`, `start`, `startSubtree`, `mountComponent`, `unmountComponent`
- Extensibility: `directive`, `use`, `binders`
- Lifecycle: `onCleanup`, `setIntervalSafe`, `setTimeoutSafe`

Build outputs:
- ESM: `dist/sting.mjs`
- Global/IIFE: `dist/sting.global.js` (`window.sting`)

### 3.2 Directive Surface (implemented)

Built-in directives:
- `x-text`
- `x-show`
- `x-on`
- `x-model`
- `x-bind`
- `x-if`
- `x-for`
- `x-effect`
- `x-debug`

Expression model:
- Path-safe lookup by default (identifier/dot-path)
- `x-on` supports literal args, multiple args, and `$event`
- No arbitrary JS expression evaluation

### 3.3 Testing Surface (implemented)

Playwright coverage includes:
- Core directives and runtime teardown behavior
- Dynamic component add/remove lifecycle cleanup
- `x-if` hidden-state disposer regression
- `x-for` handler call ergonomics (`remove(i)`)
- Strict-CSP smoke page
- Edge-case fixture for nested paths and binding null-removal

## 4) P0 Blocker Status

Resolved in current codebase:

- Runtime teardown ownership:
  - Added deterministic mount/unmount tracking via `unmountComponent`.
  - Added dynamic subtree cleanup verification tests.

- `x-if` cleanup scoping:
  - Each mounted `x-if` instance now has isolated disposers.
  - Disposers run when block is removed/toggled off.

- `x-on` call semantics:
  - Supports multi-arg calls, `$event`, and curried handlers.
  - Uses lexical scope to preserve `x-for` item/index correctness.

- `start()` contract:
  - Manual `start(root?)` semantics clarified for `document` vs explicit root.

## 5) v1 Required Contract Status

A feature is considered v1-ready when implementation + tests + docs exist.

### 5.1 Reactivity

Required:
- Stable semantics for `signal`, `effect`, `computed`, `batch`, `untrack`
- Cleanup semantics covered by tests

Status:
- Satisfied for v1 baseline

### 5.2 Runtime/Lifecycle

Required:
- Deterministic mount/unmount lifecycle
- Reliable disposer ownership

Status:
- Satisfied for v1 baseline

### 5.3 Directives

Required:
- Stable contract for v1 directive set
- Explicit supported/not-supported behavior

Status:
- Implemented and documented in `docs/directives.md`

### 5.4 CSP

Required:
- No runtime eval/function compilation
- Strict-CSP docs and smoke test

Status:
- Implemented with `docs/csp.md` and `test/csp.spec.js`

### 5.5 Packaging and Release Ops

Required:
- Stable exports/builds
- Changelog + release policy/checklist
- CI build/test/size gates

Status:
- Implemented in repo; publishing/tagging remains manual release step

## 6) CSP-Friendly UX

Yes, CSP friendliness and easy authoring can coexist.

v1 approach:
1. Keep directive expressions path-safe.
2. Improve parser ergonomics without enabling arbitrary JS evaluation.
3. Keep computation in component functions/signals.
4. Document CSP-safe patterns with copy-paste examples.

## 7) Definition of Done for 1.0.0

All must be true:
1. Runtime/directive P0 regressions are fixed and tested.
2. Directive/API/CSP docs are published in-repo.
3. CI is green (build + tests + size budget).
4. Release checklist is completed.
5. Version/tag/publish steps are executed.

## 8) Out of Scope for v1

- Full Alpine expression language parity
- SSR hydration engine
- Virtual DOM / JSX layer
- Advanced keyed diff patching beyond current full-list rerender behavior

## 9) Final Release Steps

1. Create and push git tag `v1.0.0`.
2. Publish package (`npm publish`).
3. Publish release notes from `CHANGELOG.md`.

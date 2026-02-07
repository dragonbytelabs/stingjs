# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Ongoing post-1.0 improvements.

## [1.0.0] - 2026-02-07

### Added
- `stingjs.md` as v1 source-of-truth contract.
- `llm_tasks.md` release execution plan.
- CSP smoke fixture (`static/csp-smoke.html`, `static/csp-smoke.js`) and Playwright coverage.
- Edge-case fixture/tests for nested model paths, attribute null removal, and event args.
- Bundle size budget checker (`scripts/check-size.mjs`).
- Documentation set: API, directives contract, CSP guide, compatibility, and release policy.
- CI workflow with build, test, size budget, and browser matrix jobs.

### Changed
- Runtime teardown now disposes mounted components deterministically, including dynamically added roots.
- `x-if` now scopes and disposes per-mount instance disposers on unmount.
- `x-on` now supports multi-arg calls, `$event`, curried handlers, and stable lexical scope behavior for `x-for`.
- `start()` behavior is now explicit for document vs explicit root starts.
- Playwright config and scripts now support chromium default and full cross-browser matrix.

### Fixed
- Prevented nested `x-data` directive double-binding by stopping parent hydration at nested component roots.
- Fixed list-item event handler ergonomics for `x-on:click="remove(i)"`.
- Fixed lifecycle regressions where directive effects/listeners were not disposed on DOM removal.

## [0.1.0] - Initial pre-v1 baseline

- Initial reactive core and directive set.

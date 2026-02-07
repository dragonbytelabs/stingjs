# CSP Guide

StingJS is designed for CSP-friendly usage.

## Security Model

StingJS directive parsing uses path-safe expressions and does not require:
- `eval`
- `new Function`
- inline JS snippets in directive values

## Recommended Policy (baseline)

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  connect-src 'self';
  img-src 'self' data:;
  style-src 'self' 'unsafe-inline';
  object-src 'none';
  base-uri 'none'
```

Notes:
- `style-src 'unsafe-inline'` is often needed when directives mutate inline style/class behavior.
- Keep `script-src` free of `unsafe-eval`.

## Authoring Patterns

Use these patterns for CSP-safe ergonomics:
- Keep logic in component factory functions/signals.
- Use `x-on` with path-safe calls and literal args.
- Use curried handlers for loop cases (`remove(i)` returning a function).

Avoid:
- inline expression language requests that require runtime code evaluation
- introducing an eval fallback for convenience

## Smoke Test Fixture

A strict-CSP fixture is included:
- `static/csp-smoke.html`
- `static/csp-smoke.js`

Playwright coverage:
- `test/csp.spec.js`

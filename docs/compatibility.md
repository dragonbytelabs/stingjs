# Compatibility

## Supported Browsers (v1 target)

StingJS targets modern evergreen browsers with support for:
- ES modules
- `Proxy`
- `WeakMap`
- `MutationObserver`

Practical baseline:
- Chromium (current stable)
- Firefox (current stable)
- WebKit/Safari (current stable)

## Test Matrix

Playwright projects:
- chromium
- firefox
- webkit

Default local command runs chromium for speed:
- `npm test`

Full matrix:
- `npm run test:all`

## Notes

- Legacy browsers without modern JS features are out of scope for v1.
- No transpilation/polyfill strategy is provided for IE-era environments.

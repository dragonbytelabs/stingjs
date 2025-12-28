/**

Context object passed to every directive binder.

Provides everything a directive needs without importing runtime internals.

@typedef {Object} DirectiveContext

@property {Element} el

The DOM element currently being processed.

@property {any} scope

The component scope object returned by the x-data factory.

@property {(el: Element, name: string) => string | null} getAttr

Helper to read an attribute value from an element.

@property {(scope: any, path: string) => any} resolvePath

Resolves a dot-path expression (e.g. "user.name") against the component scope.

@property {(fn: () => void) => () => void} effect

Creates a reactive effect that re-runs when its dependencies change.

Returns a dispose function.

@property {<T>(fn: () => T) => T} untrack

Runs a function without collecting reactive dependencies.

@property {Array<() => void>} disposers

List of cleanup functions to run when the component is destroyed.
*/
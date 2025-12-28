/**
 * A directive binder function.
 *
 * @typedef {(ctx: import('./runtime.js').DirectiveContext) => void} DirectiveBinder
 */

/** @type {DirectiveBinder[]} */
export const binders = []

/** @type {Set<DirectiveBinder>} */
const binderSet = new Set()

/**
 * Register a directive binder.
 * Idempotent: registering the same binder twice is a no-op.
 *
 * @param {DirectiveBinder} binder
 * @returns {() => void} unregister function
 */
export function directive(binder) {
    if (!binderSet.has(binder)) {
        binderSet.add(binder)
        binders.push(binder)
    }

    // optional: allow unregistering (handy for tests/devtools)
    return () => {
        if (!binderSet.delete(binder)) return
        const i = binders.indexOf(binder)
        if (i >= 0) binders.splice(i, 1)
    }
}

/**
 * Install a plugin.
 * A plugin is a function that receives the Sting API.
 *
 * @param {(sting: { directive: typeof directive }) => void} plugin
 */
export function use(plugin) {
    plugin({ directive })
}

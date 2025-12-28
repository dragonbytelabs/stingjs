/** @type {Map<string, () => any>} */
const registry = new Map()

/**
 * Register a component factory by name.
 * x-data="name" will call this factory to create the component scope.
 *
 * @param {string} name
 * @param {() => any} factory
 */
export function data(name, factory) {
    registry.set(name, factory)
}

/**
 * Get a component factory by name.
 * Internal use only.
 *
 * @param {string} name
 * @returns {(() => any) | undefined}
 */
export function getFactory(name) {
    return registry.get(name)
}

import { effect, untrack } from "./reactivity.js"
import { getFactory } from "./registry.js"
import { binders } from "./directives.js"

/**
 * Context passed to directive binders.
 *
 * @typedef {Object} DirectiveContext
 * @property {Element} el
 *   The DOM element currently being processed.
 * @property {any} scope
 *   Component scope returned by the x-data factory.
 * @property {(el: Element, name: string) => string | null} getAttr
 *   Reads an attribute from an element.
 * @property {(scope: any, path: string) => any} resolvePath
 *   Resolves a CSP-safe dot-path (e.g. "user.name") against scope.
 * @property {(fn: () => void) => () => void} effect
 *   Creates a reactive effect; returns a disposer.
 * @property {<T>(fn: () => T) => T} untrack
 *   Reads values without collecting dependencies.
 * @property {Array<() => void>} disposers
 *   Per-component cleanup functions.
 */

/**
 * Get an attribute from an element.
 * @param {Element} el
 * @param {string} name
 * @returns {string | null}
 */
function getAttr(el, name) {
    return el.getAttribute(name)
}

/**
 * Walk the element subtree depth-first.
 * @param {Element} root
 * @param {(el: Element) => void} fn
 */
function walk(root, fn) {
    /** @type {Element[]} */
    const stack = [root]
    while (stack.length) {
        const node = stack.pop()
        if (!node) continue
        fn(node)
        for (let i = node.children.length - 1; i >= 0; i--) {
            stack.push(node.children[i])
        }
    }
}

/**
 * Resolve a dot-path like "user.name" against a scope object.
 * CSP-friendly: only identifiers + dot access (no calls/operators).
 *
 * @param {any} scope
 * @param {string} path
 * @returns {any}
 */
function resolvePath(scope, path) {
    const parts = path.split(".").map((s) => s.trim()).filter(Boolean)
    let cur = scope
    for (const p of parts) cur = cur?.[p]
    return cur
}

/**
 * Mount a component root: creates the scope and binds directives in its subtree.
 *
 * Returns a destroy function that removes event listeners and disposes effects
 * created for this component only.
 *
 * @param {Element} rootEl
 * @returns {(() => void) | undefined}
 */
function mountComponent(rootEl) {
    const name = getAttr(rootEl, "x-data")
    if (!name) return

    const factory = getFactory(name)
    if (!factory) {
        console.warn(`[sting] unknown component "${name}"`, rootEl)
        return
    }

    const scope = factory()

    /** @type {Array<() => void>} */
    const disposers = [] // ✅ per-component, not global

    walk(rootEl, (el) => {
        /** @type {DirectiveContext} */
        const ctx = {
            el,
            scope,
            getAttr,
            resolvePath,
            effect,
            untrack,
            disposers,
        }

        for (const bind of binders) {
            bind(ctx)
        }
    })

    return () => {
        for (let i = disposers.length - 1; i >= 0; i--) {
            try {
                disposers[i]()
            } catch (e) {
                console.error("[sting] error during disposer", e)
            }
        }
    }
}

/**
 * Start StingJS on a root node.
 * Finds all elements with x-data and mounts them.
 *
 * Returns a stop() function that unmounts everything mounted by this call.
 *
 * @param {Document | Element} root
 * @returns {() => void}
 */
export function start(root = document) {
    const roots = root.querySelectorAll("[x-data]")
    const destroys = new Map()

    for (const el of roots) {
        const destroy = mountComponent(el)
        if (destroy) destroys.set(el, destroy)
    }

    const mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.removedNodes) {
                if (!(node instanceof Element)) continue

                // if the removed node IS a root
                if (destroys.has(node)) {
                    destroys.get(node)()
                    destroys.delete(node)
                }

                // if it CONTAINS roots
                node.querySelectorAll?.("[x-data]").forEach((el) => {
                    if (destroys.has(el)) {
                        destroys.get(el)()
                        destroys.delete(el)
                    }
                })
            }
        }
    })

    mo.observe(root === document ? document.body : root, { childList: true, subtree: true })

    return () => {
        mo.disconnect()
        for (const destroy of destroys.values()) destroy()
        destroys.clear()
    }
}

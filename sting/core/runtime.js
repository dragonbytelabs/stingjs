import { effect, untrack } from "./reactivity.js"
import { getFactory } from "./registry.js"
import { binders } from "./directives.js"
import { devAssert, devWarn } from "./utils.js"

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
 * @property {(scope: any, path: string) => any} getPath
 *   Gets a dot-path (e.g. "user.name") against scope.
 * @property {(scope: any, path: string, value: any) => void} setPath
 *   Sets a dot-path (e.g. "user.name") against scope.
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
 * 
 * @param {any} scope
 * @param {string} path
 * @returns {any}
 */
function getPath(scope, path) {
    const parts = path.split(".").map((s) => s.trim()).filter(Boolean)
    let cur = scope
    for (const p of parts) cur = cur?.[p]
    return cur
}

/**
 * Set a dot-path like "user.name" against a scope object.
 * 
 * @param {any} scope
 * @param {string} path
 * @param {any} value
 */
function setPath(scope, path, value) {
    const parts = path.split(".").map((s) => s.trim()).filter(Boolean)
    if (parts.length === 0) return
    let cur = scope;
    for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        cur = cur?.[key]

        if (cur == null) {
            console.warn(`setPath: "${path}" not reachable (missing "${key}")`)
            return
        }
    }

    const last = parts[parts.length - 1];
    cur[last] = value
}

/**
 * Apply all registered directives to the subtree of rootEl.
 *
 * @param {Element} rootEl
 * @param {any} scope
 * @param {Array<() => void>} disposers
 */
export function applyDirectives(rootEl, scope, disposers) {
    walk(rootEl, (el) => {
        /** @type {DirectiveContext} */
        const ctx = {
            el,
            scope,
            getAttr,
            getPath,
            setPath,
            effect,
            untrack,
            disposers,
        }
        for (const bind of binders) bind(ctx)
    })
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
    devAssert(rootEl instanceof Element, "[sting] mountComponent expects an Element")

    const name = getAttr(rootEl, "x-data")
    devAssert(!!name, `[sting] mountComponent called without x-data`)

    const factory = getFactory(name)
    if (!factory) {
        devWarn(
            `[sting] component "${name}" not registered yet. ` +
            `Did you call sting.data("${name}", ...) before DOM ready?`,
            rootEl
        )
        return
    }

    const scope = factory()

    /** @type {Array<() => void>} */
    const disposers = []
    applyDirectives(rootEl, scope, disposers)

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
    devAssert(root === document || root instanceof Element, "[sting] start(root) expects Document or Element")

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

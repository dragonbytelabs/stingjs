import { bindXDebug } from "./directives/x-debug.js"
import { bindXOn } from "./directives/x-on.js"
import { bindXShow } from "./directives/x-show.js"
import { bindXText } from "./directives/x-text.js"

/**
 * List of directive binder functions applied to every element.
 *
 * Each binder inspects the element for a specific directive and
 * attaches behavior if present.
 *
 * @type {Array<(ctx: DirectiveContext) => void>}
 */
const binders = [
    bindXOn,
    bindXDebug,
    bindXShow,
    bindXText,
]


/**
 * StingJS (very small blazingly-fast JAVASCRIPT library)
 * Goals:
 * - No build step
 * - Solid-ish reactivity (signals/effects)
 * - Alpine-ish directives (x-data, x-text, x-on:click)
 */

/**
 * A reactive computation runner that can be subscribed to signals.
 * It also tracks which signals it subscribed to, so it can unsubscribe later.
 *
 * @typedef {(() => void) & { deps: Set<Set<Runner>> }} Runner
 */

/** @type {Map<string, () => any>} */
const registry = new Map()

/**
 * Global pointer to the currently running reactive computation (effect).
 * When a signal is read and Listener is set, the signal registers Listener
 * as a subscriber.
 *
 * @type {null | Runner}
 */
let Listener = null

/**
 * When batching, signal writes queue effects here instead of running immediately.
 * @type {null | Set<Runner>}
 */
let BatchQueue = null

/**
 * Run multiple signal updates with a single flush of effects at the end.
 *
 * @template T
 * @param {() => T} fn
 * @returns {T}
 *
 * @example
 * batch(() => {
 *   setA(1)
 *   setB(2)
 * })
 */
export function batch(fn) {
    const prev = BatchQueue
    const queue = new Set()
    BatchQueue = queue
    try {
        return fn()
    } finally {
        // Restore previous batch (supports nesting)
        BatchQueue = prev

        // Only flush if we are the top-level batch
        if (!prev) {
            for (const runner of queue) runner()
        } else {
            // Merge into parent batch
            for (const runner of queue) prev.add(runner)
        }
    }
}

/**
 * Create a reactive signal (a single reactive value).
 *
 * @template T
 * @param {T} initial Initial value.
 * @returns {[() => T, (next: T | ((prev: T) => T)) => T]} A getter and setter.
 *
 * @example
 * const [count, setCount] = signal(0)
 * effect(() => console.log(count()))
 * setCount(c => c + 1)
 */
export function signal(initial) {
    let value = initial
    /** @type {Set<Runner>} */
    const observers = new Set()

    /**
     * Read current value. If an effect is running, subscribe it.
     * @returns {any}
     */
    function read() {
        if (Listener) {
            observers.add(Listener)
            Listener.deps.add(observers)
        }
        return value
    }

    /**
     * Write a new value. Notifies subscribed effects if the value changed.
     * @param {any} next
     * @returns {any} The updated value.
     */
    function write(next) {
        const nextValue = typeof next === "function" ? next(value) : next
        if (Object.is(nextValue, value)) return value

        value = nextValue
        if (BatchQueue) {
            for (const fn of observers) BatchQueue.add(fn)
        } else {
            const toRun = Array.from(observers)
            for (const fn of toRun) fn()
        }
        return value
    }

    read._debugObservers = observers
    return [read, write]
}

/**
 * Create a reactive effect (a computation that re-runs when its dependencies change).
 * Dependencies are tracked automatically by observing which signals are read while
 * the effect runs.
 *
 * NOTE (MVP): this doesn't yet implement dependency cleanup/unsubscribe.
 *
 * @param {() => void} fn
 * @returns {() => void} dispose function (currently a no-op placeholder)
 *
 * @example
 * const [count, setCount] = signal(0)
 * const dispose = effect(() => console.log(count()))
 * setCount(1) // triggers effect
 */
export function effect(fn) {
    let disposed = false
    /** @type {Runner} */
    const runner = /** @type {any} */ (function run() {
        if (disposed) return
        // Unsubscribe from previous dependencies (if any)
        for (const depObservers of runner.deps) {
            depObservers.delete(runner)
        }
        runner.deps.clear()

        // Set "current running effect"
        const prev = Listener
        Listener = runner
        try {
            fn()
        } finally {
            Listener = prev
        }
    })

    runner.deps = new Set()

    // Initial run
    runner()

    // Dispose: unsubscribe and make it inert
    return function dispose() {
        if (disposed) return
        disposed = true

        for (const depObservers of runner.deps) {
            depObservers.delete(runner)
        }
        runner.deps.clear()
    }
}

// ============================================================================
// Store + produce: nested-ish state ergonomics on top of signals
// ============================================================================

/**
 * Produce helper: takes a "mutate the draft" function and returns an updater
 * function suitable for setStore(updater).
 *
 * @template T
 * @param {(draft: T) => void} mutator
 * @returns {(prev: T) => T}
 *
 * @example
 * setUser(produce(d => { d.name = "Frodo" }))
 */
export function produce(mutator) {
    return (prev) => {
        // MVP clone strategy:
        // - structuredClone if available (handles more types)
        // - fallback JSON clone (loses Dates/Maps/functions/etc)
        const draft =
            typeof structuredClone === "function"
                ? structuredClone(prev)
                : JSON.parse(JSON.stringify(prev))

        mutator(draft)
        return draft
    }
}

/**
 * Run a function without collecting reactive dependencies.
 * Equivalent to SolidJS untrack().
 *
 * @template T
 * @param {() => T} fn
 * @returns {T}
 */
export function untrack(fn) {
    const prev = Listener
    Listener = null
    try {
        return fn()
    } finally {
        Listener = prev
    }
}

/**
 * Create a store for nested objects.
 * This MVP store is "signal-backed":
 * - the whole object lives in a signal
 * - the returned Proxy reads from that signal (so effects track)
 * - writes use produce to replace the object
 *
 * @template {Record<string, any>} T
 * @param {T} initial
 * @returns {[T, (next: T | ((prev: T) => T)) => void]}
 *
 * @example
 * const [user, setUser] = store({ name: "Sam" })
 * effect(() => console.log(user.name))
 * setUser(produce(d => { d.name = "Frodo" }))
 */
export function store(initial) {
    const [get, set] = signal(initial)

    /** @type {any} */
    const proxy = new Proxy(
        {},
        {
            get(_target, prop) {
                // allow inspection and symbols
                if (prop === Symbol.toStringTag) return "StingStore"
                if (prop === "__raw") return get()

                const cur = get()
                return cur?.[prop]
            },

            set(_target, prop, value) {
                set(
                    produce((d) => {
                        d[prop] = value
                    })
                )
                return true
            },

            ownKeys() {
                return Reflect.ownKeys(get() ?? {})
            },

            getOwnPropertyDescriptor(_target, prop) {
                const cur = get()
                if (cur && prop in cur) {
                    return { enumerable: true, configurable: true }
                }
            },
        }
    )

    /**
     * Set store value.
     * Accepts:
     * - a new object
     * - an updater(prev) => next (including produce(...))
     *
     * @param {any} next
     */
    function setStore(next) {
        set(next)
    }

    return [proxy, setStore]
}

// ============================================================================
// Component registry: sting.data(name, factory)
// ============================================================================

/**
 * Register a component factory by name.
 * x-data="name" will call this factory to create the component scope.
 *
 * CSP-friendly rule: name is an identifier; not an expression.
 *
 * @param {string} name
 * @param {() => any} factory
 */
export function data(name, factory) {
    registry.set(name, factory)
}

// ============================================================================
// DOM runtime: walk + directives
// ============================================================================

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

    const factory = registry.get(name)
    if (!factory) {
        console.warn(`[sting] unknown component "${name}"`, rootEl)
        return
    }

    const scope = factory()

    /** @type {Array<() => void>} */
    const disposers = [] // ✅ per-component, not global

    walk(rootEl, (el) => {
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


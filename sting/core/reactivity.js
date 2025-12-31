import { devAssert } from "./utils.js"

/**
 * A reactive computation runner that can be subscribed to signals.
 * It also tracks which signal observer-sets it is currently subscribed to.
 *
 * @typedef {(() => void) & { deps: Set<Set<Runner>> }} Runner
 */

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
        devAssert(observers instanceof Set, "[sting] signal observers must be a Set")

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

    /** @type {null | (() => void)} */
    let cleanup = null

    /** @type {Runner} */
    const runner = /** @type {any} */ (function run() {
        if (disposed) return

        if (cleanup) {
            try {
                cleanup()
            } catch (e) {
                console.error("[sting] effect cleanup error:", e)
            }
        }

        // Unsubscribe from previous dependencies (if any)
        for (const depObservers of runner.deps) {
            depObservers.delete(runner)
        }
        runner.deps.clear()

        // Set "current running effect"
        const prev = Listener
        Listener = runner
        try {
            const ret = fn()
            if (typeof ret === "function") {
                cleanup = ret
            }
        } finally {
            Listener = prev
        }
    })

    runner.deps = new Set()

    // Initial run
    runner()

    // Dispose: run cleanup + unsubscribe 
    return function dispose() {
        if (disposed) return
        disposed = true

        if(cleanup) {
            try {
                cleanup()
            } catch (e) {
                console.error("[sting] effect cleanup error:", e)
            }
        }

        for (const depObservers of runner.deps) {
            depObservers.delete(runner)
        }
        runner.deps.clear()
    }
}

/**
 * Create a computed signal (a read-only signal derived from other signals).
 *
 * @param {() => any} fn
 * @returns {() => any} getter function
 * 
 * @example
 * const [count, setCount] = signal(0)
 * const double = computed(() => count() * 2)
 * effect(() => console.log(double()))
 * setCount(1) // triggers effect, logs 2
 */
export function computed(fn) {
    const [get, set] = signal(undefined)

    const dispose = effect(() => {
        set(fn())
    })

    get.dispose = dispose
    return get
}

/**
 * Run a function without collecting reactive dependencies.
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

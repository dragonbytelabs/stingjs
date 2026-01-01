import { devAssert } from "./utils.js"

/**
 * A reactive computation runner that can be subscribed to signals.
 * It also tracks which signal observer-sets it is currently subscribed to.
 *
 * @typedef {(() => void) & { deps: Set<Set<Runner>> }} Runner
 */

/**
 * Symbol used to mark Sting signal getter functions.
 * This lets unwrap() distinguish signals from normal functions (like event handlers).
 */
export const STING_SIGNAL = Symbol.for("sting.signal")

/**
 * Global pointer to the currently running reactive computation (effect).
 *
 * @type {null | Runner}
 */
let Listener = null

/**
 * When batching, signal writes queue effects here instead of running immediately.
 * @type {null | Set<Runner>}
 */
let BatchQueue = null

export function batch(fn) {
  const prev = BatchQueue
  const queue = new Set()
  BatchQueue = queue
  try {
    return fn()
  } finally {
    BatchQueue = prev

    if (!prev) {
      for (const runner of queue) runner()
    } else {
      for (const runner of queue) prev.add(runner)
    }
  }
}

/**
 * Create a reactive signal (a single reactive value).
 *
 * @template T
 * @param {T} initial
 * @returns {[() => T, (next: T | ((prev: T) => T)) => T]}
 */
export function signal(initial) {
  let value = initial
  /** @type {Set<Runner>} */
  const observers = new Set()

  function read() {
    if (Listener) {
      observers.add(Listener)
      Listener.deps.add(observers)
    }
    return value
  }

  // MARK THIS FUNCTION AS A SIGNAL GETTER
  read[STING_SIGNAL] = true

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
 * Create a reactive effect: a computation that re-runs whenever its dependencies change.
 *
 * @param {() => void} fn
 * @returns {() => void} dispose function
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

    for (const depObservers of runner.deps) {
      depObservers.delete(runner)
    }
    runner.deps.clear()

    const prev = Listener
    Listener = runner
    try {
      const ret = fn()
      if (typeof ret === "function") cleanup = ret
    } finally {
      Listener = prev
    }
  })

  runner.deps = new Set()
  runner()

  return function dispose() {
    if (disposed) return
    disposed = true

    if (cleanup) {
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
 * Create a derived signal whose value is computed from other signals.
 *
 * @template T
 * @param {() => T} fn
 * @returns {() => T}
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
 * 
 * Runs the given function without tracking any signal reads.
 * 
 * @param {() => void} fn
 * @returns {() => void} fn 
 * 
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

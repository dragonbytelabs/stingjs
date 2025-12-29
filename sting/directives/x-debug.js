import { directive } from "../core/directives.js"

/**
 * Bind the `x-debug` directive.
 *
 * Renders live debug information about a signal directly into the DOM.
 * Intended for development only.
 *
 * Examples:
 *   <div x-debug="$open"></div>
 *   <div x-debug="open"></div> // will try `$open` automatically
 *
 * Behavior:
 * - Displays the current signal value
 * - Displays the number of subscribed observers
 * - Subscribes to the signal so the debug output stays live
 * - Uses `untrack()` when reading values to avoid feedback loops
 *
 * @param {import("../sting/sting.js").DirectiveContext} ctx
 */
export function bindXDebug(ctx) {
  const { el, scope, getAttr, getPath, effect, untrack, disposers } = ctx

  const expr = getAttr(el, "x-debug")
  if (!expr) return

  let sig = getPath(scope, expr)

  // If the value facade was passed (e.g. "open"), try "$open"
  if (typeof sig !== "function") {
    sig = getPath(scope, `$${expr}`)
  }

  const dispose = effect(() => {
    if (typeof sig !== "function") {
      el.textContent = `debug(${expr}): not a signal getter`
      return
    }

    // Subscribe so this effect reruns when the signal changes
    sig()

    // Read without tracking to avoid self-triggering loops
    const value = untrack(() => sig())
    const observers = sig._debugObservers?.size ?? "?"

    el.textContent =
      `debug(${expr}): value=${String(value)} observers=${observers}`
  })

  disposers.push(dispose)
}

directive(bindXDebug)
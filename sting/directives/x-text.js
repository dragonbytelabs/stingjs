import { directive } from "../core/directives.js"

/**
 * Bind the `x-text` directive.
 *
 * Keeps `el.textContent` in sync with a reactive expression.
 *
 * Example:
 *   <span x-text="user.name"></span>
 *
 * Behavior:
 * - Evaluates the expression against the component scope.
 * - Re-runs automatically when any accessed signal changes.
 * - Updates textContent with the resolved value (or empty string if null/undefined).
 *
 * @param {import("../core/runtime.js").DirectiveContext} ctx
 */
export function bindXText(ctx) {
  const { el, scope, getAttr, getPath, effect, disposers } = ctx

  const expr = getAttr(el, "x-text")
  if (!expr) return

  const dispose = effect(() => {
    const value = getPath(scope, expr)
    el.textContent = value ?? ""
  })

  disposers.push(dispose)
}

directive(bindXText)

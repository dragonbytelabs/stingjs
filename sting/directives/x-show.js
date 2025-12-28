import { directive } from "../core/directives.js"

/**
 * Bind the `x-show` directive.
 *
 * Toggles element visibility using `display: none` based on a reactive value.
 *
 * Example:
 *   <div x-show="open"></div>
 *
 * Behavior:
 * - Truthy value → element is shown
 * - Falsy value → element is hidden (`display: none`)
 * - Preserves the element’s original inline `display` style
 *
 * @param {import("../sting/sting.js").DirectiveContext} ctx
 */
export function bindXShow(ctx) {
  const { el, scope, getAttr, resolvePath, effect, disposers } = ctx

  const expr = getAttr(el, "x-show")
  if (!expr) return

  const initialDisplay = el.style.display

  const dispose = effect(() => {
    const value = resolvePath(scope, expr)
    el.style.display = value ? initialDisplay : "none"
  })

  disposers.push(dispose)
}

directive(bindXShow)
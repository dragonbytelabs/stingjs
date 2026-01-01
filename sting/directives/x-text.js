import { directive } from "../core/directives.js"
import { devAssert, devWarn, isPathSafe, unwrap } from "../core/utils.js"

/**
 * x-text directive
 *
 * Sets the textContent of an element to the value of a scope path.
 *
 * Example:
 *   <div x-text="username"></div>
 *
 * Constraints:
 * - The expression must be a safe dot-path (no eval).
 */
export function bindXText(ctx) {
  const { el, scope, getAttr, getPath, effect, disposers } = ctx

  const expr = getAttr(el, "x-text")
  if (!expr) return

  devAssert(isPathSafe(expr), `[sting] x-text invalid path "${expr}"`)

  const dispose = effect(() => {
    const raw = getPath(scope, expr)
    let v = unwrap(raw)

    // If value is a plain function (NOT a signal), treat it like a computed getter.
    if (typeof v === "function") {
      try {
        v = v.length > 0 ? v(scope) : v()
      } catch (e) {
        devWarn(`[sting] x-text "${expr}" threw while evaluating`, e)
        v = ""
      }
    }

    el.textContent = v == null ? "" : String(v)
  })

  disposers.push(dispose)
}

directive(bindXText)

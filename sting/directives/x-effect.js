import { directive } from "../core/directives.js"
import { devAssert, devWarn, isPathSafe } from "../core/utils.js"

export function bindXEffect(ctx) {
  const { el, scope, getAttr, getPath, effect, disposers } = ctx

  const expr = getAttr(el, "x-effect")
  if (!expr) return

  devAssert(isPathSafe(expr), `[sting] x-effect invalid path "${expr}"`)

  const dispose = effect(() => {
    const fn = getPath(scope, expr)
    if (typeof fn !== "function") {
      devWarn(`[sting] x-effect "${expr}" is not a function`, el)
      return
    }
    try {
      // allow cleanup return
      return fn.length > 0 ? fn(el, scope) : fn()
    } catch (e) {
      devWarn(`[sting] x-effect "${expr}" threw`, e)
    }
  })

  disposers.push(dispose)
}

directive(bindXEffect)

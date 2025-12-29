import { directive } from "../core/directives.js"
import { devAssert, devWarn, isPathSafe } from "../core/utils.js"

/**
 * Bind `x-on:*` event directives.
 *
 * @param {import("../core/runtime.js").DirectiveContext} ctx
 */
export function bindXOn(ctx) {
  const { el, scope, getPath, disposers } = ctx

  // prevent duplicate listeners if the binder runs twice.
  const bound = getOrInitBoundMap(el)

  for (const attr of el.attributes) {
    if (!attr.name.startsWith("x-on:")) continue

    const eventName = attr.name.slice(5).trim()
    const expr = (attr.value ?? "").trim()

    if (!eventName) {
      devWarn(`[sting] invalid ${attr.name} (missing event name)`, el)
      continue
    }

    if (!expr) {
      devWarn(`[sting] ${attr.name} is missing a handler name`, el)
      continue
    }

    devAssert(isPathSafe(expr), `[sting] ${attr.name} invalid handler path "${expr}"`)

    // idempotency: avoid binding same event+expr twice on same element
    const key = `${eventName}::${expr}`
    if (bound.has(key)) continue

    const handlerFn = getPath(scope, expr)
    if (typeof handlerFn !== "function") {
      devWarn(`[sting] ${attr.name}="${expr}" is not a function`, el)
      continue
    }

    const handler = (e) => handlerFn(e)

    el.addEventListener(eventName, handler)
    disposers.push(() => el.removeEventListener(eventName, handler))

    bound.set(key, handler)
  }
}

directive(bindXOn)

/** @type {WeakMap<Element, Map<string, Function>>} */
const _boundListeners = new WeakMap()

function getOrInitBoundMap(el) {
  let m = _boundListeners.get(el)
  if (!m) {
    m = new Map()
    _boundListeners.set(el, m)
  }
  return m
}

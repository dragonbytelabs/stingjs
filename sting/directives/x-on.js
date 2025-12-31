import { directive } from "../core/directives.js"
import { devAssert, devWarn, isPathSafe, unwrap } from "../core/utils.js"

export function bindXOn(ctx) {
  const { el, scope, getPath, disposers } = ctx

  // bind all x-on:* on this element
  for (const attr of el.attributes) {
    if (!attr.name.startsWith("x-on:")) continue

    const eventName = attr.name.slice("x-on:".length).trim()
    const expr = (attr.value ?? "").trim()

    if (!eventName) {
      devWarn(`[sting] x-on missing event name`, el)
      continue
    }
    if (!expr) {
      devWarn(`[sting] x-on:${eventName} missing expression`, el)
      continue
    }

    const parsed = parseOnExpr(expr)
    devAssert(!!parsed, `[sting] x-on:${eventName} invalid expression "${expr}"`)

    const handler = (ev) => {
      const { fnPath, arg } = parsed

      devAssert(isPathSafe(fnPath), `[sting] x-on:${eventName} invalid fn path "${fnPath}"`)

      // IMPORTANT: resolve scope at click-time
      const scopeNow = getClosestScope(el) || scope

      // IMPORTANT: do NOT unwrap() handlers; unwrap() may execute functions
      const maybeFn = getPath(scopeNow, fnPath)

      devAssert(typeof maybeFn === "function", `[sting] x-on:${eventName} "${fnPath}" is not a function`)

      // Call styles:
      // - fn(event)
      // - fn(arg, event)
      if (arg == null) {
        maybeFn(ev)
        return
      }

      const argVal = resolveArg(scopeNow, getPath, arg)
      maybeFn(argVal, ev)
    }

    el.addEventListener(eventName, handler)
    disposers.push(() => el.removeEventListener(eventName, handler))
  }
}

directive(bindXOn)

function getClosestScope(el) {
  let cur = el
  while (cur && cur !== document.body) {
    if (cur.hasAttribute?.("x-data") && cur.__stingScope) return cur.__stingScope
    cur = cur.parentNode
  }
  return null
}

// Supports:
//  - "inc"
//  - "remove(i)"
//  - "obj.remove(i)"
function parseOnExpr(expr) {
  const s = expr.trim()

  // call form: fn(arg)
  const m = s.match(/^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\(\s*(.*?)\s*\)\s*$/)
  if (m) {
    const fnPath = m[1]
    const rawArg = m[2]
    const arg = rawArg === "" ? null : rawArg
    return { fnPath, arg }
  }

  // plain path form: fn
  if (isPathSafe(s)) return { fnPath: s, arg: null }

  return null
}

function resolveArg(scope, getPath, argExpr) {
  const s = String(argExpr).trim()

  // string literal
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1)
  }

  // number literal
  if (/^-?\d+(?:\.\d+)?$/.test(s)) return Number(s)

  // boolean/null/undefined
  if (s === "true") return true
  if (s === "false") return false
  if (s === "null") return null
  if (s === "undefined") return undefined

  // identifier/path from scope (allow signals here)
  devAssert(isPathSafe(s), `[sting] x-on arg must be a safe path or literal, got "${s}"`)
  const v = getPath(scope, s)
  return unwrap(v)
}

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
      const { fnPath, args } = parsed

      devAssert(isPathSafe(fnPath), `[sting] x-on:${eventName} invalid fn path "${fnPath}"`)

      // Use the lexical scope captured at bind-time.
      // This preserves x-for item/index scopes.
      const scopeNow = scope

      // IMPORTANT: do NOT unwrap() handlers; unwrap() may execute functions
      const maybeFn = getPath(scopeNow, fnPath)

      devAssert(typeof maybeFn === "function", `[sting] x-on:${eventName} "${fnPath}" is not a function`)

      let ret

      // Call styles:
      // - fn           => fn(event)
      // - fn(arg)      => fn(resolvedArg, event)
      // - fn(a, b, c)  => fn(resolvedA, resolvedB, resolvedC, event)
      if (args == null) {
        ret = maybeFn(ev)
      } else {
        const argValues = args.map((arg) => resolveArg(scopeNow, getPath, arg, ev))
        ret = maybeFn(...argValues, ev)
      }

      // Support curry-style handlers: x-on:click="remove(i)" where remove(i) returns a function.
      if (typeof ret === "function") ret(ev)
    }

    el.addEventListener(eventName, handler)
    disposers.push(() => el.removeEventListener(eventName, handler))
  }
}

directive(bindXOn)

// Supports:
//  - "inc"
//  - "remove(i)"
//  - "sum(a, b)"
//  - "obj.remove(i)"
function parseOnExpr(expr) {
  const s = expr.trim()

  // call form: fn(...)
  const m = s.match(/^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\((.*)\)\s*$/)
  if (m) {
    const fnPath = m[1]
    const rawArgs = m[2].trim()
    if (!rawArgs) return { fnPath, args: [] }

    const args = splitArgs(rawArgs)
    if (!args) return null
    if (args.some((a) => a.length === 0)) return null

    return { fnPath, args }
  }

  // plain path form: fn
  if (isPathSafe(s)) return { fnPath: s, args: null }

  return null
}

function resolveArg(scope, getPath, argExpr, ev) {
  const s = String(argExpr).trim()

  if (s === "$event") return ev

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

/**
 * Split comma-separated arguments while respecting quotes and nested parentheses.
 *
 * @param {string} source
 * @returns {string[] | null}
 */
function splitArgs(source) {
  const out = []
  let cur = ""
  let quote = null
  let depth = 0

  for (let i = 0; i < source.length; i++) {
    const ch = source[i]
    const prev = i > 0 ? source[i - 1] : ""

    if (quote) {
      cur += ch
      if (ch === quote && prev !== "\\") quote = null
      continue
    }

    if (ch === "'" || ch === '"') {
      quote = ch
      cur += ch
      continue
    }

    if (ch === "(") {
      depth++
      cur += ch
      continue
    }

    if (ch === ")") {
      if (depth === 0) return null
      depth--
      cur += ch
      continue
    }

    if (ch === "," && depth === 0) {
      out.push(cur.trim())
      cur = ""
      continue
    }

    cur += ch
  }

  if (quote || depth !== 0) return null
  out.push(cur.trim())
  return out
}
